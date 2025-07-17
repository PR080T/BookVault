from flask import Blueprint, send_from_directory, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt
from models import Files, FilesSchema, Books
from db import db
import os
import csv

files_endpoint = Blueprint('files', __name__)


def get_allowed_extensions():
    return set(current_app.config.get("ALLOWED_EXTENSIONS", {"csv"}))


@files_endpoint.route("/v1/files/<filename>", methods=["GET"])
@jwt_required()
def download_file(filename):
    claim_id = get_jwt()["id"]
    file = Files.query.filter_by(filename=filename, owner_id=claim_id).first()

    if file:
        try:
            export_folder = os.getenv("EXPORT_FOLDER", "export_data")
            return send_from_directory(
                os.path.abspath(export_folder), filename, as_attachment=True
            )
        except FileNotFoundError:
            return jsonify({
                "error": "Not found",
                "message": "File not found on disk"
            }), 404
        except Exception as e:
            current_app.logger.error(f"Error downloading file: {e}")
            return jsonify({
                "error": "Internal server error",
                "message": "Unable to download file"
            }), 500
    return jsonify({
        "error": "Not found",
        "message": "File not found or access denied"
    }), 404


@files_endpoint.route("/v1/files", methods=["GET"])
@jwt_required()
def get_files():
    claim_id = get_jwt()["id"]
    file_schema = FilesSchema(many=True)
    files = Files.query.filter_by(owner_id=claim_id).order_by(
        Files.created_at.desc()
    ).all()

    if files:
        return jsonify(file_schema.dump(files)), 200
    return jsonify({"error": "Not found", "message": "No files found"}), 404


def allowed_file(filename):
    return ('.' in filename and
            filename.rsplit('.', 1)[1].lower() in get_allowed_extensions())


@files_endpoint.route("/v1/files", methods=["POST"])
@jwt_required()
def upload_file_for_import():
    claim_id = get_jwt()["id"]

    if "file" not in request.files:
        return jsonify({
            "error": "Invalid file submission",
            "message": "The 'file' field is required."
        }), 400
    if "type" not in request.form:
        return jsonify({
            "error": "Invalid file submission",
            "message": "The 'type' field is required."
        }), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({
            "error": "Missing file",
            "message": "No file uploaded."
        }), 400

    if file and allowed_file(file.filename):
        import_type = request.form.get("type", "").lower()
        allow_duplicates = (
            request.form.get("allow_duplicates", "false").lower() == "true"
        )
        count_imported = 0

        if import_type == "csv":
            required_headers = {
                "title", "isbn", "description", "reading_status",
                "current_page", "total_pages", "author", "rating"
            }
        elif import_type == "goodreads":
            required_headers = {
                "Title", "ISBN13", "Author", "My Rating",
                "Number of Pages", "Exclusive Shelf"
            }
        else:
            return jsonify({
                "error": "Invalid value",
                "message": "type must be one of: csv, goodreads."
            }), 400

        try:
            stream = file.stream.read().decode("utf-8").splitlines()
            reader = csv.DictReader(stream)
        except UnicodeDecodeError:
            return jsonify({
                "error": "Invalid file encoding",
                "message": "File must be UTF-8 encoded"
            }), 400
        except Exception as e:
            current_app.logger.error(f"CSV read error: {e}")
            return jsonify({
                "error": "File reading error",
                "message": "Unable to read the uploaded file"
            }), 400

        missing = required_headers - set(reader.fieldnames or [])
        if missing:
            return jsonify({
                "error": "Missing required headers",
                "message": f"Missing headers: {list(missing)}"
            }), 400

        try:
            for row in reader:
                if import_type == "csv":
                    rating = _safe_float(row.get("rating"))
                    current_page = _safe_int(row.get("current_page"))
                    total_pages = _safe_int(row.get("total_pages"))
                    title = row.get("title", "")
                    isbn = row.get("isbn", "")
                    description = row.get("description", "")
                    status = row.get("reading_status", "")
                    author = row.get("author", "")
                else:  # goodreads
                    rating = _safe_float(row.get("My Rating"))
                    total_pages = _safe_int(row.get("Number of Pages"))
                    current_page = 0
                    title = row.get("Title", "")
                    isbn = (row.get("ISBN13", "")
                            .replace('"', '').replace("=", ""))
                    description = None
                    author = row.get("Author", "")
                    shelf = row.get("Exclusive Shelf", "").lower()
                    status = _map_shelf_to_status(shelf)

                if not isbn:
                    continue

                if (allow_duplicates or
                        not Books.query.filter_by(
                            owner_id=claim_id, isbn=isbn).first()):
                    book = Books(
                        owner_id=claim_id,
                        title=title,
                        isbn=isbn,
                        description=description,
                        reading_status=status,
                        current_page=current_page,
                        total_pages=total_pages,
                        author=author,
                        rating=rating
                    )
                    db.session.add(book)
                    count_imported += 1
            db.session.commit()
            return jsonify({
                "message": (f"Imported {count_imported}/"
                           f"{reader.line_num - 1} books.")
            }), 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Import failed: {e}")
            return jsonify({
                "error": "Import failed",
                "message": "An error occurred during import."
            }), 500

    return jsonify({
        "error": "Invalid file type",
        "message": f"Allowed file types: {', '.join(get_allowed_extensions())}"
    }), 400


def _safe_float(value):
    try:
        val = float(value)
        return val if 0 <= val <= 5 else None
    except (ValueError, TypeError):
        return None


def _safe_int(value):
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0


def _map_shelf_to_status(shelf):
    mapping = {
        "to-read": "To be read",
        "read": "Read",
        "currently-reading": "Currently reading",
        "on-hold": "To be read"  # Map on-hold to "To be read"
    }
    return mapping.get(shelf, "To be read")  # Default to "To be read"

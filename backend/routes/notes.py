from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from models import Notes, Books
from db import db

notes_endpoint = Blueprint('notes', __name__)


@notes_endpoint.route("/v1/notes/<id>", methods=["DELETE"])
@jwt_required()
def remove_note(id):
    try:
        note_id = int(id)
    except ValueError:
        return jsonify({
            "error": "Bad request",
            "message": "Note ID must be an integer"
        }), 400

    claim_id = get_jwt()["id"]
    note = Notes.query.join(Books, Books.id == Notes.book_id).filter(
        Books.owner_id == claim_id, Notes.id == note_id
    ).first()

    if note:
        try:
            db.session.delete(note)
            db.session.commit()
            return jsonify({'message': 'Note removed successfully'}), 200
        except Exception as e:
            current_app.logger.error(f"Error deleting note: {e}")
            db.session.rollback()
            return jsonify({
                "error": "Internal server error",
                "message": "An error occurred while deleting the note"
            }), 500
    else:
        return jsonify({
            "error": "Not found",
            "message": f"No note with ID: {id} was found"
        }), 404


@notes_endpoint.route("/v1/notes/<id>", methods=["PATCH"])
@jwt_required()
def edit_note(id):
    try:
        note_id = int(id)
    except ValueError:
        return jsonify({
            "error": "Bad request",
            "message": "Note ID must be an integer"
        }), 400

    claim_id = get_jwt()["id"]
    note = Notes.query.join(Books, Books.id == Notes.book_id).filter(
        Books.owner_id == claim_id, Notes.id == note_id
    ).first()

    if not note:
        return jsonify({
            "error": "Not found",
            "message": f"No note with ID: {id} was found"
        }), 404

    if not request.is_json:
        return jsonify({
            "error": "Bad request",
            "message": "Request must contain JSON body"
        }), 400

    data = request.get_json()
    updated = False

    if "visibility" in data:
        visibility = data["visibility"]
        if visibility not in ["public", "hidden"]:
            return jsonify({
                "error": "Bad request",
                "message": "Visibility must be either 'public' or 'hidden'"
            }), 400
        note.visibility = visibility
        updated = True

    # Handle note content updates (if implemented)
    if "content" in data:
        content = data["content"].strip()
        if not content:
            return jsonify({
                "error": "Bad request",
                "message": "Note content cannot be empty"
            }), 400
        note.note = content
        updated = True
    
    # Handle quote updates (if implemented)
    if "quote" in data:
        quote = data.get("quote", "").strip() or None
        note.quote = quote
        updated = True
    
    # Handle quote_page updates (if implemented)
    if "quote_page" in data:
        quote_page = data.get("quote_page")
        if quote_page is not None:
            try:
                quote_page = int(quote_page)
                if quote_page < 1:
                    return jsonify({
                        "error": "Bad request", 
                        "message": "Quote page must be a positive integer"
                    }), 400
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Bad request",
                    "message": "Quote page must be a valid integer"
                }), 400
        note.quote_page = quote_page
        updated = True

    if not updated:
        return jsonify({
            "error": "Bad request",
            "message": ("No valid fields to update. Allowed fields: "
                       "visibility, content, quote, quote_page")
        }), 400

    try:
        db.session.commit()
        return jsonify({'message': 'Note changed successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error updating note: {e}")
        db.session.rollback()
        return jsonify({
            "error": "Internal server error",
            "message": "An error occurred while updating the note"
        }), 500
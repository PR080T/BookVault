from flask import Blueprint, request, jsonify, current_app  # Flask web framework components
from flask_jwt_extended import jwt_required, get_jwt  # Flask web framework components
from models import Notes, Books
from db import db

notes_endpoint = Blueprint('notes', __name__)


@notes_endpoint.route("/v1/notes/<id>", methods=["DELETE"])
@jwt_required()  # Requires valid JWT token for access
def remove_note(id):  # Function: remove_note
    try:  # Exception handling block
        note_id = int(id)
    except ValueError:  # Exception handler
        return jsonify({
            "error": "Bad request",
            "message": "Note ID must be an integer"
        }), 400

    claim_id = get_jwt()["id"]
    note = Notes.query.join(Books, Books.id == Notes.book_id).filter(
        Books.owner_id == claim_id, Notes.id == note_id
    ).first()

    if note:  # Conditional statement
        try:  # Exception handling block
            db.session.delete(note)
            db.session.commit()
            return jsonify({'message': 'Note removed successfully'}), 200
        except Exception as e:  # Exception handler
            current_app.logger.error(f"Error deleting note: {e}")
            db.session.rollback()
            return jsonify({
                "error": "Internal server error",
                "message": "An error occurred while deleting the note"
            }), 500
    else:  # Default case
        return jsonify({
            "error": "Not found",
            "message": f"No note with ID: {id} was found"
        }), 404


@notes_endpoint.route("/v1/notes/<id>", methods=["PATCH"])
@jwt_required()  # Requires valid JWT token for access
def edit_note(id):  # Function: edit_note
    try:  # Exception handling block
        note_id = int(id)
    except ValueError:  # Exception handler
        return jsonify({
            "error": "Bad request",
            "message": "Note ID must be an integer"
        }), 400

    claim_id = get_jwt()["id"]
    note = Notes.query.join(Books, Books.id == Notes.book_id).filter(
        Books.owner_id == claim_id, Notes.id == note_id
    ).first()

    if not note:  # Conditional statement
        return jsonify({
            "error": "Not found",
            "message": f"No note with ID: {id} was found"
        }), 404

    if not request.is_json:  # Conditional statement
        return jsonify({
            "error": "Bad request",
            "message": "Request must contain JSON body"
        }), 400

    data = request.get_json()
    updated = False

    if "visibility" in data:  # Conditional statement
        visibility = data["visibility"]
        if visibility not in ["public", "hidden"]:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Visibility must be either 'public' or 'hidden'"
            }), 400
        note.visibility = visibility
        updated = True

  # Handle note content updates (if implemented)
    if "content" in data:  # Conditional statement
        content = data["content"].strip()
        if not content:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Note content cannot be empty"
            }), 400
        note.note = content
        updated = True
    
  # Handle quote updates (if implemented)
    if "quote" in data:  # Conditional statement
        quote = data.get("quote", "").strip() or None
        note.quote = quote
        updated = True
    
  # Handle quote_page updates (if implemented)
    if "quote_page" in data:  # Conditional statement
        quote_page = data.get("quote_page")
        if quote_page is not None:  # Conditional statement
            try:  # Exception handling block
                quote_page = int(quote_page)
                if quote_page < 1:  # Conditional statement
                    return jsonify({
                        "error": "Bad request", 
                        "message": "Quote page must be a positive integer"
                    }), 400
            except (ValueError, TypeError):  # Exception handler
                return jsonify({
                    "error": "Bad request",
                    "message": "Quote page must be a valid integer"
                }), 400
        note.quote_page = quote_page
        updated = True

    if not updated:  # Conditional statement
        return jsonify({
            "error": "Bad request",
            "message": ("No valid fields to update. Allowed fields: "
                       "visibility, content, quote, quote_page")
        }), 400

    try:  # Exception handling block
        db.session.commit()
        return jsonify({'message': 'Note changed successfully'}), 200
    except Exception as e:  # Exception handler
        current_app.logger.error(f"Error updating note: {e}")
        db.session.rollback()
        return jsonify({
            "error": "Internal server error",
            "message": "An error occurred while updating the note"
        }), 500
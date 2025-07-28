from flask import Blueprint, request, jsonify  # Flask web framework components
from flask_jwt_extended import jwt_required, get_jwt  # Flask web framework components
from models import UserSettings, UserSettingsSchema
from db import db
from datetime import datetime  # Date and time handling

settings_endpoint = Blueprint('settings', __name__)


@settings_endpoint.route("/v1/settings", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_settings():  # Getter method for settings
    """Get the settings for the logged-in user."""
    claim_id = get_jwt().get("id")
    if not claim_id:
        return jsonify({
            "error": "Unauthorized", 
            "message": "Invalid JWT claim"
        }), 401

    user_settings = UserSettings.query.filter_by(owner_id=claim_id).first()
    if user_settings:
        schema = UserSettingsSchema()
        return jsonify(schema.dump(user_settings)), 200
    else:
        return jsonify({
            "error": "Not found",
            "message": "User settings not found"
        }), 404


@settings_endpoint.route("/v1/settings", methods=["PATCH"])
@jwt_required()
def edit_settings():
    """Update the settings for the logged-in user."""
    claim_id = get_jwt().get("id")
    if not claim_id:  # Conditional statement
        return jsonify({
            "error": "Unauthorized", 
            "message": "Invalid JWT claim"
        }), 401

    user_settings = UserSettings.query.filter_by(owner_id=claim_id).first()
    if not user_settings:  # Conditional statement
        return jsonify({
            "error": "Not found",
            "message": "User settings not found."
        }), 404

    data = request.get_json(silent=True)
    if not data:  # Conditional statement
        return jsonify({
            "error": "Bad request",
            "message": "No JSON body provided."
        }), 400

    updated = False

    if "send_book_events" in data:  # Conditional statement
        val = data["send_book_events"]
        user_settings.send_book_events = (
            bool(val) if isinstance(val, bool) 
            else str(val).lower() == "true"
        )
        updated = True

    if "mastodon_url" in data:  # Conditional statement
        user_settings.mastodon_url = str(data["mastodon_url"]).strip()
        updated = True

    if "mastodon_access_token" in data:  # Conditional statement
        user_settings.mastodon_access_token = (
            str(data["mastodon_access_token"]).strip()
        )
        updated = True

    if not updated:  # Conditional statement
        return jsonify({
            "error": "Bad request",
            "message": ("No valid fields to update. Provide at least one of: "
                        "send_book_events, mastodon_url, "
                        "mastodon_access_token.")
        }), 400

    user_settings.updated_at = datetime.utcnow()

    try:  # Exception handling block
        db.session.commit()
        return jsonify({"message": "User settings updated"}), 200
    except Exception as e:  # Exception handler
        db.session.rollback()
        return jsonify({
            "error": "Unknown error",
            "message": f"Failed to update user settings: {str(e)}"
        }), 500
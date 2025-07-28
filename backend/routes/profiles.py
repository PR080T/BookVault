from flask import Blueprint, request, jsonify  # Flask web framework components
from flask_jwt_extended import jwt_required, get_jwt  # Flask web framework components
from models import Profile, ProfileSchema, UserSettings
from decorators import required_params

profiles_endpoint = Blueprint('profiles', __name__)


@profiles_endpoint.route("/v1/profiles/<display_name>", methods=["GET"])
def get_profile(display_name):  # Getter method for profile
    profile_schema = ProfileSchema()
    profile = Profile.query.filter(
        Profile.display_name == display_name, Profile.visibility == "public"
    ).first()

    if profile:  # Conditional statement
        return jsonify(profile_schema.dump(profile)), 200
    else:  # Default case
        return jsonify({
            "error": "Not found",
            "message": "No profile found"
        }), 404


@profiles_endpoint.route("/v1/profiles", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_profile_by_logged_in_id():  # Getter method for profile_by_logged_in_id
    claim_id = get_jwt()["id"]
    profile_schema = ProfileSchema()
    profile = Profile.query.filter(Profile.owner_id == claim_id).first()

    if profile:  # Conditional statement
        return jsonify(profile_schema.dump(profile)), 200
    else:  # Default case
        return jsonify({
            "error": "Not found",
            "message": "You have not created a profile yet"
        }), 404


@profiles_endpoint.route("/v1/profiles", methods=["POST"])
@jwt_required()  # Requires valid JWT token for access
@required_params("display_name")  # Decorator: required_params
def create_profile():  # Function: create_profile
    claim_id = get_jwt()["id"]
    data = request.get_json()

    existing_profile = Profile.query.filter(
        Profile.owner_id == claim_id
    ).first()
    if existing_profile:  # Conditional statement
        return jsonify({
            "error": "Conflict",
            "message": "Profile already exists"
        }), 409

    visibility = data.get("visibility", "hidden")
    if visibility not in ["hidden", "public"]:  # Conditional statement
        visibility = "hidden"

    display_name = data.get("display_name", "").strip()
    if not display_name or len(display_name) > 100:  # Conditional statement
        return jsonify({
            "error": "Bad request",
            "message": "Display name must be between 1 and 100 characters"
        }), 400

    name_taken = Profile.query.filter(
        Profile.display_name == display_name
    ).first()
    if name_taken:  # Conditional statement
        return jsonify({
            "error": "Conflict",
            "message": "Display name is already taken"
        }), 409

    new_profile = Profile(
        owner_id=claim_id,
        name=display_name,  # Set the required name field
        display_name=display_name,
        visibility=visibility
    )
    new_user_settings = UserSettings(owner_id=claim_id)

    try:  # Exception handling block
        new_profile.save_to_db()
        new_user_settings.save_to_db()
        return jsonify({"message": "Profile created"}), 200
    except Exception as e:  # Exception handler
        return jsonify({
            "error": "Internal server error",
            "message": f"Failed to create profile: {str(e)}"
        }), 500


@profiles_endpoint.route("/v1/profiles", methods=["PATCH"])
@jwt_required()  # Requires valid JWT token for access
def edit_profile():  # Function: edit_profile
    claim_id = get_jwt()["id"]
    profile = Profile.query.filter(Profile.owner_id == claim_id).first()

    if not profile:  # Conditional statement
        return jsonify({
            "error": "Not found",
            "message": "No profile was found."
        }), 404

    data = request.get_json()
    if not data:  # Conditional statement
        return jsonify({
            "error": "Bad request",
            "message": "No update data provided"
        }), 400

    if "display_name" in data:  # Conditional statement
        display_name = data["display_name"].strip()
        if not display_name or len(display_name) > 100:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Display name must be between 1 and 100 characters"
            }), 400

        duplicate = Profile.query.filter(
            Profile.display_name == display_name,
            Profile.owner_id != claim_id
        ).first()
        if duplicate:  # Conditional statement
            return jsonify({
                "error": "Conflict",
                "message": "Display name is already taken"
            }), 409
        profile.display_name = display_name

    if "visibility" in data and data["visibility"] in ["hidden", "public"]:  # Conditional statement
        profile.visibility = data["visibility"]

    try:  # Exception handling block
        profile.save_to_db()
        return jsonify({"message": "Profile updated"}), 200
    except Exception as e:  # Exception handler
        return jsonify({
            "error": "Internal server error",
            "message": f"Failed to update profile: {str(e)}"
        }), 500

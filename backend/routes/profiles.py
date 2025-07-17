from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import Profile, ProfileSchema, UserSettings
from decorators import required_params

profiles_endpoint = Blueprint('profiles', __name__)


@profiles_endpoint.route("/v1/profiles/<display_name>", methods=["GET"])
def get_profile(display_name):
    profile_schema = ProfileSchema()
    profile = Profile.query.filter(
        Profile.display_name == display_name, Profile.visibility == "public"
    ).first()

    if profile:
        return jsonify(profile_schema.dump(profile)), 200
    else:
        return jsonify({
            "error": "Not found",
            "message": "No profile found"
        }), 404


@profiles_endpoint.route("/v1/profiles", methods=["GET"])
@jwt_required()
def get_profile_by_logged_in_id():
    claim_id = get_jwt()["id"]
    profile_schema = ProfileSchema()
    profile = Profile.query.filter(Profile.owner_id == claim_id).first()

    if profile:
        return jsonify(profile_schema.dump(profile)), 200
    else:
        return jsonify({
            "error": "Not found",
            "message": "You have not created a profile yet"
        }), 404


@profiles_endpoint.route("/v1/profiles", methods=["POST"])
@jwt_required()
@required_params("display_name")
def create_profile():
    claim_id = get_jwt()["id"]
    data = request.get_json()

    existing_profile = Profile.query.filter(
        Profile.owner_id == claim_id
    ).first()
    if existing_profile:
        return jsonify({
            "error": "Conflict",
            "message": "Profile already exists"
        }), 409

    visibility = data.get("visibility", "hidden")
    if visibility not in ["hidden", "public"]:
        visibility = "hidden"

    display_name = data.get("display_name", "").strip()
    if not display_name or len(display_name) > 100:
        return jsonify({
            "error": "Bad request",
            "message": "Display name must be between 1 and 100 characters"
        }), 400

    name_taken = Profile.query.filter(
        Profile.display_name == display_name
    ).first()
    if name_taken:
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

    try:
        new_profile.save_to_db()
        new_user_settings.save_to_db()
        return jsonify({"message": "Profile created"}), 200
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": f"Failed to create profile: {str(e)}"
        }), 500


@profiles_endpoint.route("/v1/profiles", methods=["PATCH"])
@jwt_required()
def edit_profile():
    claim_id = get_jwt()["id"]
    profile = Profile.query.filter(Profile.owner_id == claim_id).first()

    if not profile:
        return jsonify({
            "error": "Not found",
            "message": "No profile was found."
        }), 404

    data = request.get_json()
    if not data:
        return jsonify({
            "error": "Bad request",
            "message": "No update data provided"
        }), 400

    if "display_name" in data:
        display_name = data["display_name"].strip()
        if not display_name or len(display_name) > 100:
            return jsonify({
                "error": "Bad request",
                "message": "Display name must be between 1 and 100 characters"
            }), 400

        duplicate = Profile.query.filter(
            Profile.display_name == display_name,
            Profile.owner_id != claim_id
        ).first()
        if duplicate:
            return jsonify({
                "error": "Conflict",
                "message": "Display name is already taken"
            }), 409
        profile.display_name = display_name

    if "visibility" in data and data["visibility"] in ["hidden", "public"]:
        profile.visibility = data["visibility"]

    try:
        profile.save_to_db()
        return jsonify({"message": "Profile updated"}), 200
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": f"Failed to update profile: {str(e)}"
        }), 500

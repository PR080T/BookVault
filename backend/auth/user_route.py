from flask import Blueprint, jsonify  # Flask web framework components
from models import User, UserSchema
from auth.decorators import require_role
from flask_jwt_extended import jwt_required, get_jwt_identity  # Flask web framework components

user_endpoint = Blueprint('user_endpoint', __name__)


@user_endpoint.route("/v1/users/me", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_logged_in_user():  # Getter method for logged_in_user
    """
    Get the currently authenticated user's profile.
    Requires a valid access token.
    """
    user_schema = UserSchema()
    user = User.query.filter_by(email=get_jwt_identity()).first()
    if not user:  # Conditional statement
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user_schema.dump(user)), 200


@user_endpoint.route('/v1/users', methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
@require_role("admin")  # Decorator: require_role
def get_all_users():  # Getter method for all_users
    """
    Get all users in the system (admin only).
    Requires a valid access token with admin role.
    """
    user_schema = UserSchema(many=True)
    users = User.query.all()
    return jsonify(user_schema.dump(users)), 200

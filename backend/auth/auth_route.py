from flask import Blueprint, request, jsonify
from flask_jwt_extended import (create_access_token, create_refresh_token,
                                jwt_required, get_jwt_identity, get_jwt)
from auth.models import RevokedTokenModel
from models import User, UserSchema, Verification
from db import db
from typing import Dict, Any, Union
import random
import string
from datetime import datetime, timedelta
import os
from auth.decorators import disable_route
from rate_limiter import rate_limit
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_endpoint = Blueprint('auth', __name__)


def str_to_bool(val):
    """Convert string/boolean value to boolean"""
    if isinstance(val, bool):
        return val
    return str(val).lower() in ["true", "yes", "y", "1"]


def validate_email(email):
    """Validate email format using regex"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password_strength(password):
    """
    Validate password strength and return error message if invalid
    Returns None if password is valid
    """
    from security import validate_password_complexity
    
    result = validate_password_complexity(password)
    if not result["valid"]:
        return result["errors"][0]  # Return first error
    
    return None


@auth_endpoint.route("/v1/register", methods=["POST"])
@disable_route(not str_to_bool(
    os.environ.get("AUTH_ALLOW_REGISTRATION", True)
))
@rate_limit(max_requests=3, window_minutes=5)
def register():
    """
    Register a new user account
    
    Expected JSON payload:
    {
        "email": "user@example.com",
        "password": "SecurePassword123!",
        "name": "User Name"
    }
    """
    try:
        # Validate request payload
        if not request.json:
            return jsonify({'message': 'Request must contain JSON data'}), 400
        
        required_fields = ["email", "password", "name"]
        missing_fields = [
            field for field in required_fields if field not in request.json
        ]
        
        if missing_fields:
            return jsonify({
                'message': (
                    f'Missing required fields: {", ".join(missing_fields)}'
                )
            }), 422

        # Extract and validate email
        email = request.json["email"].strip().lower()
        if not email:
            return jsonify({'message': 'Email cannot be empty'}), 422
        
        if not validate_email(email):
            return jsonify({'message': 'Invalid email format'}), 422

        # Validate password strength
        password = request.json["password"]
        password_error = validate_password_strength(password)
        if password_error:
            return jsonify({'message': password_error}), 422

        # Validate name
        name = request.json["name"].strip()
        if not name:
            return jsonify({'message': 'Name cannot be empty'}), 422
        
        if len(name) > 255:
            return jsonify({
                'message': 'Name must be less than 255 characters'
            }), 422

        # Check if user already exists
        if User.find_by_email(email):
            return jsonify({
                'message': f'Email {email} is already in use'
            }), 409

        # Create new user
        new_user = User(
            email=email, 
            password=User.generate_hash(password), 
            name=name
        )

        # Generate verification code
        code = "".join(random.choices(
            string.ascii_uppercase + string.digits, k=8
        ))

        new_user.save_to_db()
        user_obj = User.find_by_email(email)
        
        if not user_obj:
            raise Exception("Failed to retrieve created user")

        # Create verification record
        require_verification = str_to_bool(
            os.environ.get("AUTH_REQUIRE_VERIFICATION", "True")
        )
        if require_verification:
            new_verification = Verification(
                user_id=user_obj.id, 
                code=code, 
                code_valid_until=(
                    datetime.now() + timedelta(days=1)
                )
            )
        else:
            new_verification = Verification(
                user_id=user_obj.id, 
                status="verified", 
                code=None, 
                code_valid_until=None
            )
        
        new_verification.save_to_db()

        response_data = {
            'message': f'Account with email {email} was created successfully'
        }
        
        # Include verification code in response only if verification is
        # required
        # and we're in development mode
        if (require_verification and 
                os.environ.get("FLASK_ENV") == "development"):
            response_data['verification_code'] = code
            response_data['note'] = (
                'Verification code included for development only'
            )

        return jsonify(response_data), 201

    except Exception as error:
        logger.error(f"Registration error: {error}")
        # Rollback any partial database changes
        db.session.rollback()
        return jsonify({
            'message': 'Something went wrong during registration'
        }), 500


@auth_endpoint.route("/v1/verify", methods=["POST"])
def verify():
    """
    Verify user account with verification code
    
    Expected JSON payload:
    {
        "email": "user@example.com",
        "code": "ABC12345"
    }
    """
    try:
        # Validate request payload
        if not request.json:
            return jsonify({'message': 'Request must contain JSON data'}), 400
        
        if "email" not in request.json or "code" not in request.json:
            return jsonify({
                'message': 'Missing required fields: email, code'
            }), 422

        email = request.json["email"].strip().lower()
        code = request.json["code"].strip().upper()

        if not email or not code:
            return jsonify({'message': 'Email and code cannot be empty'}), 422

        # Find user by email
        current_user = User.find_by_email(email)
        if not current_user:
            return jsonify({'message': 'User not found'}), 404

        # Find verification record
        verification = Verification.query.filter(
            Verification.user_id == current_user.id
        ).first()
        if not verification:
            return jsonify({
                'message': 'Verification record not found'
            }), 404

        # Check if already verified
        if verification.status == "verified":
            return jsonify({'message': 'Account is already verified'}), 200

        # Check if code has expired
        if (verification.code_valid_until and 
                datetime.now() > verification.code_valid_until):
            return jsonify({'message': 'Verification code has expired'}), 400

        # Verify the code
        if not verification.code or verification.code != code:
            return jsonify({'message': 'Invalid verification code'}), 400

        # Update verification status
        verification.status = "verified"
        verification.code = None
        verification.code_valid_until = None
        verification.save_to_db()

        return jsonify({'message': 'Account verified successfully'}), 200

    except Exception as e:
        logger.error(f"Verification error: {e}")
        db.session.rollback()
        return jsonify({
            'message': 'Something went wrong during verification'
        }), 500


@auth_endpoint.route("/v1/login", methods=["POST"])
@rate_limit(max_requests=5, window_minutes=1)
def login():
    """
    Authenticate user and return access tokens
    
    Expected JSON payload:
    {
        "email": "user@example.com",
        "password": "SecurePassword123!"
    }
    """
    try:
        # Validate request payload
        if not request.json:
            return jsonify({'message': 'Request must contain JSON data'}), 400
        
        if "email" not in request.json or "password" not in request.json:
            return jsonify({
                'message': 'Missing required fields: email, password'
            }), 422

        email = request.json["email"].strip().lower()
        password = request.json["password"]

        if not email or not password:
            return jsonify({
                'message': 'Email and password cannot be empty'
            }), 422

        # Find user by email
        current_user = User.find_by_email(email)
        if not current_user:
            return jsonify({'message': 'Invalid email or password'}), 401

        # Check account status first
        if current_user.status == "inactive":
            return jsonify({
                'message': (
                    'Account has been deactivated. Please contact '
                    'administrator for more information.'
                )
            }), 403

        # Verify password
        if not User.verify_hash(password, current_user.password):
            return jsonify({'message': 'Invalid email or password'}), 401

        # Check if account is active
        if current_user.status != "active":
            return jsonify({'message': 'Account is not active'}), 403

        # Check verification status if verification exists
        verification = None
        if hasattr(current_user, 'verification') and current_user.verification:
            verification = current_user.verification
            if verification.status != "verified":
                return jsonify({
                    'message': (
                        'Account has not been verified. Please check your '
                        'email for verification instructions.'
                    )
                }), 403

        # Generate tokens
        access_token = create_access_token(
            identity=email,
            additional_claims={
                "role": current_user.role, "id": current_user.id
            }
        )
        refresh_token = create_refresh_token(identity=email)

        # Prepare response
        user_schema = UserSchema()
        json_output: Union[Dict[str, Any], Any] = user_schema.dump(
            current_user
        )
        
        # Ensure json_output is a dictionary (not a list)
        if isinstance(json_output, list):
            json_output = json_output[0] if json_output else {}
        elif not isinstance(json_output, dict):
            json_output = {}
        
        json_output.update({
            'access_token': access_token, 
            'refresh_token': refresh_token,
            'message': 'Login successful'
        })
        
        return jsonify(json_output), 200

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'message': 'Something went wrong during login'}), 500


@auth_endpoint.route('/v1/token/refresh', methods=['POST'])
@jwt_required(refresh=True)
def token_refresh():
    """
    Refresh access token using refresh token
    
    Requires valid refresh token in Authorization header
    """
    try:
        current_user_email = get_jwt_identity()
        current_user = User.find_by_email(current_user_email)

        if not current_user:
            return jsonify({'message': 'User not found'}), 404

        # Check if user is still active
        if current_user.status != "active":
            return jsonify({'message': 'Account is no longer active'}), 403

        # Generate new access token
        access_token = create_access_token(
            identity=current_user_email,
            additional_claims={
                "role": current_user.role, "id": current_user.id
            }
        )
        
        return jsonify({
            'access_token': access_token,
            'message': 'Token refreshed successfully'
        }), 200

    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({
            'message': 'Something went wrong during token refresh'
        }), 500


@auth_endpoint.route('/v1/token/logout/access', methods=['POST'])
@jwt_required()
def user_logout_access():
    """
    Revoke access token (logout from current session)
    
    Requires valid access token in Authorization header
    """
    try:
        jti = get_jwt()["jti"]
        revoked_token = RevokedTokenModel(jti=jti)
        revoked_token.add()
        return jsonify({
            'message': 'Access token has been revoked successfully'
        }), 200
    except Exception as e:
        logger.error(f"Failed to revoke access token: {e}")
        db.session.rollback()
        return jsonify({'message': 'Something went wrong during logout'}), 500


@auth_endpoint.route('/v1/token/logout/refresh', methods=['POST'])
@jwt_required(refresh=True)
def user_logout_refresh():
    """
    Revoke refresh token (logout from all sessions)
    
    Requires valid refresh token in Authorization header
    """
    try:
        jti = get_jwt()["jti"]
        revoked_token = RevokedTokenModel(jti=jti)
        revoked_token.add()
        return jsonify({
            'message': 'Refresh token has been revoked successfully'
        }), 200
    except Exception as e:
        logger.error(f"Failed to revoke refresh token: {e}")
        db.session.rollback()
        return jsonify({'message': 'Something went wrong during logout'}), 500


@auth_endpoint.route("/v1/user/status", methods=["GET"])
@jwt_required()
def get_user_status():
    """
    Get current user status and basic info
    
    Requires valid access token in Authorization header
    """
    try:
        current_user_email = get_jwt_identity()
        current_user = User.find_by_email(current_user_email)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        # Get verification status
        verification_status = "unknown"
        if hasattr(current_user, 'verification') and current_user.verification:
            verification_status = current_user.verification.status
        
        return jsonify({
            'id': current_user.id,
            'email': current_user.email,
            'name': current_user.name,
            'role': current_user.role,
            'status': current_user.status,
            'verification_status': verification_status
        }), 200
        
    except Exception as e:
        logger.error(f"Get user status error: {e}")
        return jsonify({'message': 'Something went wrong'}), 500

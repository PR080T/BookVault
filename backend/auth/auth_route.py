from flask import Blueprint, request, jsonify  # Flask web framework components
from flask_jwt_extended import (create_access_token, create_refresh_token,  # Flask web framework components
                                jwt_required, get_jwt_identity, get_jwt)
from auth.models import RevokedTokenModel
from models import User, UserSchema, Verification
from db import db
from typing import Dict, Any, Union
import random
import string
from datetime import datetime, timedelta  # Date and time handling
import os  # Operating system interface
from auth.decorators import disable_route
from rate_limiter import rate_limit
import logging  # Application logging
import re

  # Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_endpoint = Blueprint('auth', __name__)


def str_to_bool(val):  # Function: str_to_bool
    """Convert string/boolean value to boolean"""
    if isinstance(val, bool):
        return val
    return str(val).lower() in ["true", "yes", "y", "1"]


def validate_email(email):
    """Validate email format using regex"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password_strength(password):  # Function: validate_password_strength
    """
    Validate password strength and return error message if invalid
    Returns None if password is valid
    """
    from security import validate_password_complexity
    
    result = validate_password_complexity(password)
    if not result["valid"]:  # Conditional statement
        return result["errors"][0]  # Return first error
    
    return None


@auth_endpoint.route("/v1/register", methods=["POST"])
@disable_route(not str_to_bool(  # API endpoint route definition
    os.environ.get("AUTH_ALLOW_REGISTRATION", True)
))
@rate_limit(max_requests=3, window_minutes=5)
def register():  # Function: register
    """
    Register a new user account
    
    Expected JSON payload:
    {
        "email": "user@example.com",
        "password": "SecurePassword123!",
        "name": "User Name"
    }
    """
    try:  # Exception handling block
  # Validate request payload
        if not request.json:  # Conditional statement
            return jsonify({'message': 'Request must contain JSON data'}), 400
        
        required_fields = ["email", "password", "name"]
        missing_fields = [
            field for field in required_fields if field not in request.json
        ]
        
        if missing_fields:  # Conditional statement
            return jsonify({
                'message': (
                    f'Missing required fields: {", ".join(missing_fields)}'
                )
            }), 422

  # Extract and validate email
        email = request.json["email"].strip().lower()
        if not email:  # Conditional statement
            return jsonify({'message': 'Email cannot be empty'}), 422
        
        if not validate_email(email):  # Conditional statement
            return jsonify({'message': 'Invalid email format'}), 422

  # Validate password strength
        password = request.json["password"]
        password_error = validate_password_strength(password)
        if password_error:  # Conditional statement
            return jsonify({'message': password_error}), 422

  # Validate name
        name = request.json["name"].strip()
        if not name:  # Conditional statement
            return jsonify({'message': 'Name cannot be empty'}), 422
        
        if len(name) > 255:  # Conditional statement
            return jsonify({
                'message': 'Name must be less than 255 characters'
            }), 422

  # Check if user already exists
        if User.find_by_email(email):  # Conditional statement
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
        
        if not user_obj:  # Conditional statement
            raise Exception("Failed to retrieve created user")

  # Create verification record
        require_verification = str_to_bool(
            os.environ.get("AUTH_REQUIRE_VERIFICATION", "True")
        )
        if require_verification:  # Conditional statement
            new_verification = Verification(
                user_id=user_obj.id,
                code=code,
                code_valid_until=(
                    datetime.now() + timedelta(days=1)
                )
            )
        else:  # Default case
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
        if (require_verification and  # Conditional statement
                os.environ.get("FLASK_ENV") == "development"):
            response_data['verification_code'] = code
            response_data['note'] = (
                'Verification code included for development only'
            )

        return jsonify(response_data), 201

    except Exception as error:  # Exception handler
        import traceback
        logger.error(f"Registration error: {error}")
        logger.error(f"Registration traceback: {traceback.format_exc()}")
        
        # Rollback any partial database changes
        try:
            db.session.rollback()
        except Exception as rollback_error:
            logger.error(f"Failed to rollback session: {rollback_error}")
        
        # Check if it's a database connection error
        error_str = str(error).lower()
        if any(db_error in error_str for db_error in [
            'connection refused', 'connection to server', 'database', 
            'psycopg2', 'sqlalchemy', 'operational error'
        ]):
            return jsonify({
                'message': 'Database service is currently unavailable. Please try again later.',
                'error_type': 'database_connection_error'
            }), 503
        
        # For other errors, return generic 500
        return jsonify({
            'message': 'Something went wrong during registration',
            'error_type': 'internal_server_error'
        }), 500


@auth_endpoint.route("/v1/verify", methods=["POST"])
def verify():  # Function: verify
    """
    Verify user account with verification code
    
    Expected JSON payload:
    {
        "email": "user@example.com",
        "code": "ABC12345"
    }
    """
    try:  # Exception handling block
  # Validate request payload
        if not request.json:  # Conditional statement
            return jsonify({'message': 'Request must contain JSON data'}), 400
        
        if "email" not in request.json or "code" not in request.json:  # Conditional statement
            return jsonify({
                'message': 'Missing required fields: email, code'
            }), 422

        email = request.json["email"].strip().lower()
        code = request.json["code"].strip().upper()

        if not email or not code:  # Conditional statement
            return jsonify({'message': 'Email and code cannot be empty'}), 422

  # Find user by email
        current_user = User.find_by_email(email)
        if not current_user:  # Conditional statement
            return jsonify({'message': 'User not found'}), 404

  # Find verification record
        verification = Verification.query.filter(
            Verification.user_id == current_user.id
        ).first()
        if not verification:  # Conditional statement
            return jsonify({
                'message': 'Verification record not found'
            }), 404

  # Check if already verified
        if verification.status == "verified":  # Conditional statement
            return jsonify({'message': 'Account is already verified'}), 200

  # Check if code has expired
        if (verification.code_valid_until and  # Conditional statement
                datetime.now() > verification.code_valid_until):
            return jsonify({'message': 'Verification code has expired'}), 400

  # Verify the code
        if not verification.code or verification.code != code:  # Conditional statement
            return jsonify({'message': 'Invalid verification code'}), 400

  # Update verification status
        verification.status = "verified"
        verification.code = None
        verification.code_valid_until = None
        verification.save_to_db()

        return jsonify({'message': 'Account verified successfully'}), 200

    except Exception as e:  # Exception handler
        import traceback
        logger.error(f"Verification error: {e}")
        logger.error(f"Verification traceback: {traceback.format_exc()}")
        
        # Rollback any partial database changes
        try:
            db.session.rollback()
        except Exception as rollback_error:
            logger.error(f"Failed to rollback session: {rollback_error}")
        
        # Check if it's a database connection error
        error_str = str(e).lower()
        if any(db_error in error_str for db_error in [
            'connection refused', 'connection to server', 'database', 
            'psycopg2', 'sqlalchemy', 'operational error'
        ]):
            return jsonify({
                'message': 'Database service is currently unavailable. Please try again later.',
                'error_type': 'database_connection_error'
            }), 503
        
        # For other errors, return generic 500
        return jsonify({
            'message': 'Something went wrong during verification',
            'error_type': 'internal_server_error'
        }), 500


@auth_endpoint.route("/v1/login", methods=["POST"])
@rate_limit(max_requests=5, window_minutes=1)
def login():  # Function: login
    """
    Authenticate user and return access tokens
    
    Expected JSON payload:
    {
        "email": "user@example.com",
        "password": "SecurePassword123!"
    }
    """
    try:  # Exception handling block
  # Validate request payload
        if not request.json:  # Conditional statement
            return jsonify({'message': 'Request must contain JSON data'}), 400
        
        if "email" not in request.json or "password" not in request.json:  # Conditional statement
            return jsonify({
                'message': 'Missing required fields: email, password'
            }), 422

        email = request.json["email"].strip().lower()
        password = request.json["password"]

        if not email or not password:  # Conditional statement
            return jsonify({
                'message': 'Email and password cannot be empty'
            }), 422

  # Find user by email
        current_user = User.find_by_email(email)
        if not current_user:  # Conditional statement
            return jsonify({'message': 'Invalid email or password'}), 401

  # Check account status first
        if current_user.status == "inactive":  # Conditional statement
            return jsonify({
                'message': (
                    'Account has been deactivated. Please contact '
                    'administrator for more information.'
                )
            }), 403

  # Verify password
        if not User.verify_hash(password, current_user.password):  # Conditional statement
            return jsonify({'message': 'Invalid email or password'}), 401

  # Check if account is active
        if current_user.status != "active":  # Conditional statement
            return jsonify({'message': 'Account is not active'}), 403

  # Check verification status if verification exists
        verification = None
        if hasattr(current_user, 'verification') and current_user.verification:  # Conditional statement
            verification = current_user.verification
            if verification.status != "verified":  # Conditional statement
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
        if isinstance(json_output, list):  # Conditional statement
            json_output = json_output[0] if json_output else {}
        elif not isinstance(json_output, dict):  # Alternative condition
            json_output = {}
        
        json_output.update({
            'access_token': access_token, 
            'refresh_token': refresh_token,
            'message': 'Login successful'
        })
        
        return jsonify(json_output), 200

    except Exception as e:  # Exception handler
        import traceback
        logger.error(f"Login error: {e}")
        logger.error(f"Login traceback: {traceback.format_exc()}")
        
        # Check if it's a database connection error
        error_str = str(e).lower()
        if any(db_error in error_str for db_error in [
            'connection refused', 'connection to server', 'database', 
            'psycopg2', 'sqlalchemy', 'operational error'
        ]):
            return jsonify({
                'message': 'Database service is currently unavailable. Please try again later.',
                'error_type': 'database_connection_error'
            }), 503
        
        # For other errors, return generic 500
        return jsonify({
            'message': 'Something went wrong during login',
            'error_type': 'internal_server_error'
        }), 500


@auth_endpoint.route('/v1/token/refresh', methods=['POST'])
@jwt_required(refresh=True)  # JWT token manager
def token_refresh():  # Function: token_refresh
    """
    Refresh access token using refresh token
    
    Requires valid refresh token in Authorization header
    """
    try:  # Exception handling block
        current_user_email = get_jwt_identity()
        current_user = User.find_by_email(current_user_email)

        if not current_user:  # Conditional statement
            return jsonify({'message': 'User not found'}), 404

  # Check if user is still active
        if current_user.status != "active":  # Conditional statement
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

    except Exception as e:  # Exception handler
        logger.error(f"Token refresh error: {e}")
        return jsonify({
            'message': 'Something went wrong during token refresh'
        }), 500


@auth_endpoint.route('/v1/token/logout/access', methods=['POST'])
@jwt_required()  # Requires valid JWT token for access
def user_logout_access():  # Function: user_logout_access
    """
    Revoke access token (logout from current session)
    
    Requires valid access token in Authorization header
    """
    try:  # Exception handling block
        jti = get_jwt()["jti"]
        revoked_token = RevokedTokenModel(jti=jti)
        revoked_token.add()
        return jsonify({
            'message': 'Access token has been revoked successfully'
        }), 200
    except Exception as e:  # Exception handler
        logger.error(f"Failed to revoke access token: {e}")
        db.session.rollback()
        return jsonify({'message': 'Something went wrong during logout'}), 500


@auth_endpoint.route('/v1/token/logout/refresh', methods=['POST'])
@jwt_required(refresh=True)  # JWT token manager
def user_logout_refresh():  # Function: user_logout_refresh
    """
    Revoke refresh token (logout from all sessions)
    
    Requires valid refresh token in Authorization header
    """
    try:  # Exception handling block
        jti = get_jwt()["jti"]
        revoked_token = RevokedTokenModel(jti=jti)
        revoked_token.add()
        return jsonify({
            'message': 'Refresh token has been revoked successfully'
        }), 200
    except Exception as e:  # Exception handler
        logger.error(f"Failed to revoke refresh token: {e}")
        db.session.rollback()
        return jsonify({'message': 'Something went wrong during logout'}), 500


@auth_endpoint.route("/v1/user/status", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_user_status():  # Getter method for user_status
    """
    Get current user status and basic info
    
    Requires valid access token in Authorization header
    """
    try:  # Exception handling block
        current_user_email = get_jwt_identity()
        current_user = User.find_by_email(current_user_email)
        
        if not current_user:  # Conditional statement
            return jsonify({'message': 'User not found'}), 404
        
  # Get verification status
        verification_status = "unknown"
        if hasattr(current_user, 'verification') and current_user.verification:  # Conditional statement
            verification_status = current_user.verification.status
        
        return jsonify({
            'id': current_user.id,
            'email': current_user.email,
            'name': current_user.name,
            'role': current_user.role,
            'status': current_user.status,
            'verification_status': verification_status
        }), 200
        
    except Exception as e:  # Exception handler
        logger.error(f"Get user status error: {e}")
        return jsonify({'message': 'Something went wrong'}), 500

'''
Authentication module for BookVault API

This module provides authentication and authorization functionality including:
- User registration and login
- JWT token management
- Google OAuth integration
- User verification system
- Role-based access control
- Token revocation/blacklisting
'''

from auth.models import RevokedTokenModel
from models import User, UserSchema, Verification, VerificationSchema
from auth.decorators import require_role, disable_route
from auth.auth_route import auth_endpoint
from auth.user_route import user_endpoint

__all__ = [
    # Models
    "User",
    "UserSchema",
    "Verification",
    "VerificationSchema",
    "RevokedTokenModel",

    # Decorators
    "require_role",
    "disable_route",

    # Blueprints
    "auth_endpoint",
    "user_endpoint"
]
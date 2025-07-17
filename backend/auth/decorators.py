"""
Authentication decorators for BookVault application
"""
from functools import wraps

from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def require_role(role):
    """
    Decorator to require a specific user role for a route.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if not claims or "role" not in claims:
                return jsonify({
                    'error': 'Permission denied',
                    'message': 'No role found in token.'
                }), 403
            if claims["role"] == role:
                return fn(*args, **kwargs)
            else:
                return jsonify({
                    'error': 'Permission denied',
                    'message': 'You do not have the required permission.'
                }), 403
        return decorator
    return wrapper


def disable_route(value=False):
    """
    Decorator to disable a route based on a boolean or string value.
    When value=True, the route is disabled.
    When value=False (default), the route is enabled.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # Convert string values to boolean
            if isinstance(value, str):
                is_disabled = value.lower() in [
                    "true", "yes", "y", "1"
                ]
            else:
                is_disabled = bool(value)
            if is_disabled:
                return jsonify({
                    'error': 'Route disabled',
                    'message': 'This route has been disabled by the '
                               'administrator.'
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

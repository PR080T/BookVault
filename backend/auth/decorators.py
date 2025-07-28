"""
Authentication decorators for BookVault application
"""
from functools import wraps

from flask import jsonify  # Flask web framework components
from flask_jwt_extended import verify_jwt_in_request, get_jwt  # Flask web framework components


def require_role(role):  # Function: require_role
    """
    Decorator to require a specific user role for a route.
    """
    def wrapper(fn):  # Function: wrapper
        @wraps(fn)  # Decorator: wraps
        def decorator(*args, **kwargs):  # Function: decorator
            verify_jwt_in_request()
            claims = get_jwt()
            if not claims or "role" not in claims:  # Conditional statement
                return jsonify({
                    'error': 'Permission denied',
                    'message': 'No role found in token.'
                }), 403
            if claims["role"] == role:  # Conditional statement
                return fn(*args, **kwargs)
            else:  # Default case
                return jsonify({
                    'error': 'Permission denied',
                    'message': 'You do not have the required permission.'
                }), 403
        return decorator
    return wrapper


def disable_route(value=False):  # Function: disable_route
    """
    Decorator to disable a route based on a boolean or string value.
    When value=True, the route is disabled.
    When value=False (default), the route is enabled.
    """
    def wrapper(fn):  # Function: wrapper
        @wraps(fn)  # Decorator: wraps
        def decorator(*args, **kwargs):  # Function: decorator
  # Convert string values to boolean
            if isinstance(value, str):  # Conditional statement
                is_disabled = value.lower() in [
                    "true", "yes", "y", "1"
                ]
            else:  # Default case
                is_disabled = bool(value)
            if is_disabled:  # Conditional statement
                return jsonify({
                    'error': 'Route disabled',
                    'message': 'This route has been disabled by the '
                               'administrator.'
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

from flask import jsonify, request  # Flask web framework components
from functools import wraps


def required_params(*required_fields):  # Function: required_params
    """
    Decorator to ensure required parameters exist in the JSON body of a
    POST/PATCH request.
    Usage:
        @required_params("name", "email")
        def your_function():
            ...
    """
    def decorator(fn):  # Function: decorator
        @wraps(fn)  # Decorator: wraps
        def wrapper(*args, **kwargs):  # Function: wrapper
            if not request.is_json:  # Conditional statement
                return jsonify({
                    "status": "error",
                    "message": "Content-Type must be application/json"
                }), 400

            json_data = request.get_json(silent=True)
            if not json_data:  # Conditional statement
                return jsonify({
                    "status": "error",
                    "message": "Request body must contain valid JSON"
                }), 400

            missing_fields = [
                field
                for field in required_fields  # Loop iteration
                if field not in json_data or json_data[field] is None  # Conditional statement
            ]
            if missing_fields:  # Conditional statement
                return jsonify({
                    "status": "error",
                    "message": "Missing required parameter(s)",
                    "missing": missing_fields
                }), 400

            return fn(*args, **kwargs)
        return wrapper
    return decorator

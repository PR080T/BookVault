from flask import jsonify, request
from functools import wraps


def required_params(*required_fields):
    """
    Decorator to ensure required parameters exist in the JSON body of a
    POST/PATCH request.
    Usage:
        @required_params("name", "email")
        def your_function():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    "status": "error",
                    "message": "Content-Type must be application/json"
                }), 400

            json_data = request.get_json(silent=True)
            if not json_data:
                return jsonify({
                    "status": "error",
                    "message": "Request body must contain valid JSON"
                }), 400

            missing_fields = [
                field
                for field in required_fields
                if field not in json_data or json_data[field] is None
            ]
            if missing_fields:
                return jsonify({
                    "status": "error",
                    "message": "Missing required parameter(s)",
                    "missing": missing_fields
                }), 400

            return fn(*args, **kwargs)
        return wrapper
    return decorator

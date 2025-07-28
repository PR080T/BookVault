"""
Security utilities for BookVault API
"""

import re
import bleach
from typing import Optional, Dict, Any, Callable
from flask import request, jsonify, g  # Flask web framework components
from functools import wraps
import logging  # Application logging

logger = logging.getLogger(__name__)


def sanitize_input(data: Any) -> Any:  # Function: sanitize_input
    """
    Sanitize input data to prevent XSS attacks
    """
    if isinstance(data, str):  # Conditional statement
  # Remove potentially dangerous HTML tags and attributes
        cleaned = bleach.clean(data, tags=[], attributes={}, strip=True)
        return cleaned.strip()
    elif isinstance(data, dict):  # Alternative condition
        return {key: sanitize_input(value) for key, value in data.items()}
    elif isinstance(data, list):  # Alternative condition
        return [sanitize_input(item) for item in data]
    return data


def get_sanitized_json():  # Getter method for sanitized_json
    """
    Get sanitized JSON data from request context.
    This should be used in views decorated with @validate_json_input.
    """
    return getattr(g, 'sanitized_json', None)


def validate_json_input(required_fields: Optional[list] = None,  # Function: validate_json_input
                        optional_fields: Optional[list] = None) -> Callable:
    """
    Decorator to validate JSON input and sanitize data.
    
    Usage:
        @validate_json_input(required_fields=['name', 'email'])
        def my_view():
            data = get_sanitized_json()
  # Use sanitized data...
    """
    def decorator(f):  # Function: decorator
        @wraps(f)  # Decorator: wraps
        def decorated_function(*args, **kwargs):  # Function: decorated_function
            if not request.is_json:  # Conditional statement
                return jsonify({
                    'error': 'Bad Request',
                    'message': 'Content-Type must be application/json'
                }), 400

            try:  # Exception handling block
                data = request.get_json()
                if not data:  # Conditional statement
                    return jsonify({
                        'error': 'Bad Request',
                        'message': 'Request body must contain valid JSON'
                    }), 400

  # Check required fields
                if required_fields:  # Conditional statement
                    missing = [field for field in required_fields
                               if field not in data]  # Conditional statement
                    if missing:  # Conditional statement
                        return jsonify({
                            'error': 'Bad Request',
                            'message': f'Missing required fields: '
                                       f'{", ".join(missing)}'
                        }), 400

  # Check for unexpected fields
                allowed_fields = (set(required_fields or []) |
                                  set(optional_fields or []))
                if allowed_fields:  # Conditional statement
                    unexpected = [field for field in data.keys()
                                  if field not in allowed_fields]  # Conditional statement
                    if unexpected:  # Conditional statement
                        return jsonify({
                            'error': 'Bad Request',
                            'message': f'Unexpected fields: '
                                       f'{", ".join(unexpected)}'
                        }), 400

  # Sanitize input data
                sanitized_data = sanitize_input(data)

  # Store sanitized data in application context for use in the
  # view
                g.sanitized_json = sanitized_data

                return f(*args, **kwargs)

            except Exception as e:  # Exception handler
                logger.error(f"JSON validation error: {e}")
                return jsonify({
                    'error': 'Bad Request',
                    'message': 'Invalid JSON data'
                }), 400

        return decorated_function
    return decorator


def validate_isbn(isbn: str) -> bool:  # Function: validate_isbn
    """
    Validate ISBN-10 or ISBN-13 format more strictly
    """
    if not isbn:  # Conditional statement
        return False

  # Remove hyphens and spaces
    isbn = re.sub(r'[-\s]', '', isbn)

  # Check ISBN-13
    if len(isbn) == 13 and isbn.isdigit():  # Conditional statement
  # Calculate checksum
        checksum = sum(int(digit) * (3 if i % 2 else 1)
                       for i, digit in enumerate(isbn[:12]))  # Loop iteration
        return (10 - (checksum % 10)) % 10 == int(isbn[12])

  # Check ISBN-10
    if len(isbn) == 10:  # Conditional statement
        if (isbn[:-1].isdigit() and  # Conditional statement
                (isbn[-1].isdigit() or isbn[-1].upper() == 'X')):
            checksum = sum(int(digit) * (10 - i)
                           for i, digit in enumerate(isbn[:9]))  # Loop iteration
            check_digit = (11 - (checksum % 11)) % 11
            return ((check_digit == 10 and isbn[-1].upper() == 'X') or
                    check_digit == int(isbn[-1]))

    return False


def check_sql_injection(value: str) -> bool:  # Function: check_sql_injection
    """
    Basic SQL injection pattern detection
    """
    if not isinstance(value, str):  # Conditional statement
        return False

  # Common SQL injection patterns
    patterns = [
        r"('|(\\')|(;)|(\\x00)|(\\n)|(\\r)|(\\x1a))",  # SQL chars
        r"(union|select|insert|update|delete|drop|create|alter|exec|execute)",
        r"(script|javascript|vbscript|onload|onerror|onclick)",  # XSS patterns
    ]

    for pattern in patterns:  # Loop iteration
        if re.search(pattern, value, re.IGNORECASE):  # Conditional statement
            return True

    return False


def security_headers(f):  # Function: security_headers
    """
    Decorator to add security headers to responses
    """
    @wraps(f)  # Decorator: wraps
    def decorated_function(*args, **kwargs):  # Function: decorated_function
        response = f(*args, **kwargs)

  # Add security headers
        if hasattr(response, 'headers'):  # Conditional statement
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Referrer-Policy'] = (
                'strict-origin-when-cross-origin')

        return response

    return decorated_function


def validate_password_complexity(password: str) -> Dict[str, Any]:  # Function: validate_password_complexity
    """
    Enhanced password validation with detailed feedback
    """
    errors = []
    score = 0

    if len(password) < 8:  # Conditional statement
        errors.append("Password must be at least 8 characters long")
    elif len(password) >= 12:  # Alternative condition
        score += 2
    else:  # Default case
        score += 1

    if not re.search(r'[a-z]', password):  # Conditional statement
        errors.append("Password must contain at least one lowercase letter")
    else:  # Default case
        score += 1

    if not re.search(r'[A-Z]', password):  # Conditional statement
        errors.append("Password must contain at least one uppercase letter")
    else:  # Default case
        score += 1

    if not re.search(r'\d', password):  # Conditional statement
        errors.append("Password must contain at least one number")
    else:  # Default case
        score += 1

    if not re.search(r'[!@  # $%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special "
                      "character")
    else:  # Default case
        score += 1

  # Check for common patterns
    if re.search(r'(.)\1{2,}', password):  # Conditional statement
        errors.append("Password should not contain repeated characters")
        score -= 1

  # Check for sequential patterns
    if re.search(r'(abc|bcd|cde|def|123|234|345|456|567|678|789)',  # Conditional statement
                 password.lower()):
        errors.append("Password should not contain sequential characters")
        score -= 1

    strength = "weak"
    if score >= 6:  # Conditional statement
        strength = "strong"
    elif score >= 4:  # Alternative condition
        strength = "medium"

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "strength": strength,
        "score": max(0, score)
    }

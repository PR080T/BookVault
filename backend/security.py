"""
Security utilities for BookVault API
"""

import re
import bleach
from typing import Optional, Dict, Any, Callable
from flask import request, jsonify, g
from functools import wraps
import logging

logger = logging.getLogger(__name__)


def sanitize_input(data: Any) -> Any:
    """
    Sanitize input data to prevent XSS attacks
    """
    if isinstance(data, str):
        # Remove potentially dangerous HTML tags and attributes
        cleaned = bleach.clean(data, tags=[], attributes={}, strip=True)
        return cleaned.strip()
    elif isinstance(data, dict):
        return {key: sanitize_input(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    return data


def get_sanitized_json():
    """
    Get sanitized JSON data from request context.
    This should be used in views decorated with @validate_json_input.
    """
    return getattr(g, 'sanitized_json', None)


def validate_json_input(required_fields: Optional[list] = None,
                        optional_fields: Optional[list] = None) -> Callable:
    """
    Decorator to validate JSON input and sanitize data.
    
    Usage:
        @validate_json_input(required_fields=['name', 'email'])
        def my_view():
            data = get_sanitized_json()
            # Use sanitized data...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'error': 'Bad Request',
                    'message': 'Content-Type must be application/json'
                }), 400

            try:
                data = request.get_json()
                if not data:
                    return jsonify({
                        'error': 'Bad Request',
                        'message': 'Request body must contain valid JSON'
                    }), 400

                # Check required fields
                if required_fields:
                    missing = [field for field in required_fields
                               if field not in data]
                    if missing:
                        return jsonify({
                            'error': 'Bad Request',
                            'message': f'Missing required fields: '
                                       f'{", ".join(missing)}'
                        }), 400

                # Check for unexpected fields
                allowed_fields = (set(required_fields or []) |
                                  set(optional_fields or []))
                if allowed_fields:
                    unexpected = [field for field in data.keys()
                                  if field not in allowed_fields]
                    if unexpected:
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

            except Exception as e:
                logger.error(f"JSON validation error: {e}")
                return jsonify({
                    'error': 'Bad Request',
                    'message': 'Invalid JSON data'
                }), 400

        return decorated_function
    return decorator


def validate_isbn(isbn: str) -> bool:
    """
    Validate ISBN-10 or ISBN-13 format more strictly
    """
    if not isbn:
        return False

    # Remove hyphens and spaces
    isbn = re.sub(r'[-\s]', '', isbn)

    # Check ISBN-13
    if len(isbn) == 13 and isbn.isdigit():
        # Calculate checksum
        checksum = sum(int(digit) * (3 if i % 2 else 1)
                       for i, digit in enumerate(isbn[:12]))
        return (10 - (checksum % 10)) % 10 == int(isbn[12])

    # Check ISBN-10
    if len(isbn) == 10:
        if (isbn[:-1].isdigit() and
                (isbn[-1].isdigit() or isbn[-1].upper() == 'X')):
            checksum = sum(int(digit) * (10 - i)
                           for i, digit in enumerate(isbn[:9]))
            check_digit = (11 - (checksum % 11)) % 11
            return ((check_digit == 10 and isbn[-1].upper() == 'X') or
                    check_digit == int(isbn[-1]))

    return False


def check_sql_injection(value: str) -> bool:
    """
    Basic SQL injection pattern detection
    """
    if not isinstance(value, str):
        return False

    # Common SQL injection patterns
    patterns = [
        r"('|(\\')|(;)|(\\x00)|(\\n)|(\\r)|(\\x1a))",  # SQL chars
        r"(union|select|insert|update|delete|drop|create|alter|exec|execute)",
        r"(script|javascript|vbscript|onload|onerror|onclick)",  # XSS patterns
    ]

    for pattern in patterns:
        if re.search(pattern, value, re.IGNORECASE):
            return True

    return False


def security_headers(f):
    """
    Decorator to add security headers to responses
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = f(*args, **kwargs)

        # Add security headers
        if hasattr(response, 'headers'):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Referrer-Policy'] = (
                'strict-origin-when-cross-origin')

        return response

    return decorated_function


def validate_password_complexity(password: str) -> Dict[str, Any]:
    """
    Enhanced password validation with detailed feedback
    """
    errors = []
    score = 0

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    elif len(password) >= 12:
        score += 2
    else:
        score += 1

    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    else:
        score += 1

    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    else:
        score += 1

    if not re.search(r'\d', password):
        errors.append("Password must contain at least one number")
    else:
        score += 1

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special "
                      "character")
    else:
        score += 1

    # Check for common patterns
    if re.search(r'(.)\1{2,}', password):
        errors.append("Password should not contain repeated characters")
        score -= 1

    # Check for sequential patterns
    if re.search(r'(abc|bcd|cde|def|123|234|345|456|567|678|789)',
                 password.lower()):
        errors.append("Password should not contain sequential characters")
        score -= 1

    strength = "weak"
    if score >= 6:
        strength = "strong"
    elif score >= 4:
        strength = "medium"

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "strength": strength,
        "score": max(0, score)
    }

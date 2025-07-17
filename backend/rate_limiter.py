"""
Thread-safe in-memory rate limiter for Flask API endpoints
"""
from datetime import datetime, timedelta
import threading
from functools import wraps
from flask import request, jsonify

# In-memory store for rate limiting (in production, use Redis)
rate_limit_store = {}
rate_limit_lock = threading.Lock()


def rate_limit(max_requests=10, window_minutes=1):
    """
    Rate limiting decorator

    Args:
        max_requests: Maximum number of requests allowed
        window_minutes: Time window in minutes
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR',
                                            request.remote_addr)
            if client_ip:
                client_ip = client_ip.split(',')[0].strip()

            # Create key for this endpoint and IP
            key = f"{f.__name__}:{client_ip}"
            current_time = datetime.now()

            with rate_limit_lock:
                # Initialize or clean up old entries
                timestamps = rate_limit_store.get(key, [])
                rate_limit_store[key] = [
                    ts for ts in timestamps
                    if current_time - ts < timedelta(minutes=window_minutes)
                ]

                # Check if limit exceeded
                if len(rate_limit_store[key]) >= max_requests:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'message': (
                            f'Too many requests. Maximum {max_requests} '
                            f'requests per {window_minutes} minute(s).'
                        )
                    }), 429

                # Add current request timestamp
                rate_limit_store[key].append(current_time)

            return f(*args, **kwargs)
        return decorated_function
    return decorator

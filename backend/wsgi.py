#!/usr/bin/env python3
"""
WSGI entry point for Gunicorn
"""
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Try to import the main app
    from app import app as application
    logger.info("Successfully imported main application")
except Exception as e:
    logger.error(f"Failed to import main application: {e}")
    # Fallback to simple app
    try:
        from simple_app import app as application
        logger.info("Using simple application as fallback")
    except Exception as e2:
        logger.error(f"Failed to import simple application: {e2}")
        raise

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    application.run(host='0.0.0.0', port=port)
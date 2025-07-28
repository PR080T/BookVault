  # !/usr/bin/env python3
"""
WSGI entry point for Gunicorn
"""
import os  # Operating system interface
import sys
import logging  # Application logging

  # Set up logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)
logger = logging.getLogger(__name__)

  # Set environment variables for production
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('FLASK_DEBUG', 'false')
os.environ.setdefault('SKIP_DB_INIT', 'true')  # Skip DB init during import

def create_application():  # Function: create_application
    """Create and configure the Flask application"""
    try:
  # Import the main app
        from app import app
        logger.info("Successfully imported main application")
        
  # Skip database initialization during startup to prevent 500 errors
        logger.info("Skipping database connection test during startup")
        
        return app
        
    except Exception as e:
        logger.error(f"Failed to import main application: {e}")
        logger.error(f"Error details: {str(e)}")
        
  # Fallback to simple app
        try:
            from simple_app import app
            logger.info("Using simple application as fallback")
            return app
        except Exception as e2:
            logger.error(f"Failed to import simple application: {e2}")
            raise RuntimeError(f"Failed to start application: {e}")

  # Create the application
application = create_application()

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    application.run(host='0.0.0.0', port=port)
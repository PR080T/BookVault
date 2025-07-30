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
        # Set up environment for production
        os.environ.setdefault('FLASK_ENV', 'production')
        os.environ.setdefault('FLASK_DEBUG', 'false')
        
        # Log environment info
        logger.info(f"Starting application with environment: {os.getenv('FLASK_ENV', 'unknown')}")
        logger.info(f"DATABASE_URL configured: {'Yes' if os.getenv('DATABASE_URL') else 'No'}")
        logger.info(f"AUTH_SECRET_KEY configured: {'Yes' if os.getenv('AUTH_SECRET_KEY') else 'No'}")
        
        # Import the main app
        from app import app
        logger.info("Successfully imported main application")
        
        # Test basic app functionality
        with app.app_context():
            # Test that routes are registered
            routes = [str(rule) for rule in app.url_map.iter_rules()]
            logger.info(f"Registered {len(routes)} routes")
            
            # Log key routes for debugging
            key_routes = [r for r in routes if any(endpoint in r for endpoint in ['/', '/health', '/v1/books', '/favicon.ico'])]
            logger.info(f"Key routes available: {key_routes}")
            
            # Verify app configuration
            logger.info(f"App name: {app.name}")
            logger.info(f"Debug mode: {app.debug}")
            logger.info(f"Environment: {os.getenv('FLASK_ENV', 'unknown')}")
            
            # Test database connection if configured
            if os.getenv('DATABASE_URL'):
                try:
                    from db import db
                    db.session.execute(db.text("SELECT 1"))
                    logger.info("Database connection test successful")
                except Exception as db_error:
                    logger.warning(f"Database connection test failed: {db_error}")
                    # Don't fail here, let the app handle it
        
        return app
        
    except Exception as e:
        logger.error(f"Failed to import main application: {e}")
        logger.error(f"Error details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Fallback to simple app
        try:
            from simple_app import app as simple_app
            logger.info("Using simple application as fallback")
            
            # Test simple app routes
            simple_routes = [str(rule) for rule in simple_app.url_map.iter_rules()]
            logger.info(f"Simple app has {len(simple_routes)} routes: {simple_routes}")
            
            return simple_app
        except Exception as e2:
            logger.error(f"Failed to import simple application: {e2}")
            logger.error(f"Simple app error details: {str(e2)}")
            import traceback
            logger.error(f"Simple app traceback: {traceback.format_exc()}")
            raise RuntimeError(f"Failed to start application: {e}")

  # Create the application
application = create_application()

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    application.run(host='0.0.0.0', port=port)
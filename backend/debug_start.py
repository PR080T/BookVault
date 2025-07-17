#!/usr/bin/env python3
"""
Debug startup script for Render deployment
"""
import os
import sys
import traceback
import logging

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Debug application startup"""
    logger.info("Starting BookVault application debug...")
    
    # Print environment info
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Working directory: {os.getcwd()}")
    logger.info(f"Python path: {sys.path}")
    
    # Check critical environment variables
    critical_vars = ["DATABASE_URL", "AUTH_SECRET_KEY", "PORT"]
    for var in critical_vars:
        value = os.getenv(var)
        if value:
            if var == "DATABASE_URL":
                # Mask sensitive parts
                masked = value[:20] + "..." + value[-10:] if len(value) > 30 else value
                logger.info(f"{var}: {masked}")
            elif var == "AUTH_SECRET_KEY":
                logger.info(f"{var}: {'*' * min(len(value), 20)}")
            else:
                logger.info(f"{var}: {value}")
        else:
            logger.warning(f"{var}: NOT SET")
    
    try:
        # Test imports
        logger.info("Testing imports...")
        from app import app
        logger.info("✓ App import successful")
        
        # Test app creation
        logger.info("Testing app configuration...")
        logger.info(f"App config loaded: {bool(app.config)}")
        logger.info(f"Database URI configured: {bool(app.config.get('SQLALCHEMY_DATABASE_URI'))}")
        
        # Test database connection
        logger.info("Testing database connection...")
        from db import db
        with app.app_context():
            result = db.session.execute(db.text("SELECT 1"))
            logger.info("✓ Database connection successful")
        
        logger.info("All checks passed! Starting application...")
        
        # Start the application
        port = int(os.getenv('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=False)
        
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
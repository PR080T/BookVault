"""
Flask Application Configuration

This module contains the configuration settings for the BookVault API 
including:
- Database connection settings for PostgreSQL
- JWT token configuration
- File upload settings
- Swagger API documentation settings

Environment Variables Required:
- AUTH_SECRET_KEY: Secret key for JWT tokens
- DATABASE_URL: PostgreSQL connection string
"""

import os  # Operating system interface
from datetime import timedelta  # Date and time handling


class Config:
    """
    Flask application configuration class

    Handles all configuration settings for the BookVault API including:
    - Database connection settings for PostgreSQL
    - JWT token configuration
    - File upload settings
    - Swagger API documentation settings
    """

  # Security settings
    CSRF_ENABLED = True
    SECRET_KEY = os.environ.get("AUTH_SECRET_KEY",
                                "this-really-needs-to-be-changed")

  # Database configuration for PostgreSQL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

  # Default DB URI (will be overridden in __init__)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/bookvault"
    )

  # JWT token expiration (5 days for better user experience)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=5)  # JWT token manager
    JWT_SECRET_KEY = os.environ.get("AUTH_SECRET_KEY",  # JWT token manager
                                    "this-really-needs-to-be-changed")

  # File upload settings
    ALLOWED_EXTENSIONS = {"csv"}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

  # Production optimizations
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = False

  # Swagger/OpenAPI config
    SWAGGER = {
        "openapi": "3.0.0",
        "info": {
            "title": "BookVault API",
            "description": ("API for accessing BookVault - A personal book "
                            "tracking web app"),
            "contact": {
                "url": "https://github.com/yourusername/bookvault",
            },
            "version": "1.4.0"
        },
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            }
        },
        "specs_route": "/docs"
    }

    def __init__(self):  # Special method: __init__
        import logging
        logger = logging.getLogger(__name__)
        
        # Normalize Heroku-style DATABASE_URL
        db_url = os.environ.get(  # Database connection
            "DATABASE_URL",
            "postgresql://postgres:password@localhost:5432/bookvault"
        )
        
        logger.info(f"Original DATABASE_URL configured: {'Yes' if db_url else 'No'}")
        
        if db_url.startswith("postgres://"):  # Conditional statement
            db_url = db_url.replace("postgres://", "postgresql://", 1)  # Database connection
            logger.info("Converted postgres:// to postgresql://")
            
        self.SQLALCHEMY_DATABASE_URI = db_url
        logger.info(f"Final DATABASE_URI set: {db_url[:50]}..." if db_url else "No DATABASE_URI")

        is_production = (os.environ.get("RENDER") == "true" or
                         os.environ.get("FLASK_ENV") == "production")
        
        logger.info(f"Production mode: {is_production}")

        # Engine options with better error handling
        self.SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': True,
            'pool_recycle': 300 if is_production else 3600,
            'pool_timeout': 30 if is_production else 20,
            'pool_size': 10 if is_production else 3,
            'max_overflow': 15 if is_production else 5,
            'echo': False,  # Set to True for SQL debugging
        }

        connect_args = {
            'connect_timeout': 10,
            'application_name': 'BookVault',
            'keepalives': 1,
            'keepalives_idle': 60,
            'keepalives_interval': 10,
            'keepalives_count': 3,
        }

        if db_url.startswith('postgresql'):  # Conditional statement
            if is_production:  # Conditional statement
                connect_args.update({
                    'sslmode': 'require',
                    'options': '-c statement_timeout=30000'
                })
                logger.info("Added production SSL and timeout settings")
            else:  # Default case
                connect_args['sslmode'] = 'prefer'
                logger.info("Added development SSL settings")

            self.SQLALCHEMY_ENGINE_OPTIONS['connect_args'] = connect_args
        else:
            logger.warning(f"Non-PostgreSQL database URL detected: {db_url[:20]}...")

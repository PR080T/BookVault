"""
BookVault API Application

A Flask-based REST API for managing personal book libraries with features
including:
- User authentication and authorization
- Book management (add, edit, delete, rate)
- Reading progress tracking
- Notes and annotations
- Profile management
- File uploads and exports
- PostgreSQL database integration with Docker support

The application uses JWT for authentication and supports PostgreSQL as the
primary database.
"""

  # Import Flask core components for web application functionality
from flask import Flask, jsonify, request  # Flask: main app class, jsonify: JSON responses, request: HTTP request data
from flask_jwt_extended import JWTManager, jwt_required  # JWT token management for user authentication
from flask_cors import CORS  # Cross-Origin Resource Sharing - allows frontend to connect to backend
from config import Config  # Application configuration settings (database, JWT, etc.)
from flask_migrate import Migrate  # Database migration management for schema changes
from db import db, ma  # Database instance (SQLAlchemy) and Marshmallow for JSON serialization

  # Import all API route blueprints (groups of related endpoints)
from routes.books import books_endpoint  # Book management endpoints (add, edit, delete books)
from routes.profiles import profiles_endpoint  # User profile management endpoints
from routes.notes import notes_endpoint  # Book notes and annotations endpoints
from routes.tasks import tasks_endpoint  # Background task management endpoints
from routes.files import files_endpoint  # File upload/download endpoints
from routes.settings import settings_endpoint  # User settings management endpoints

  # Import API documentation and authentication
from flasgger import Swagger  # Automatic API documentation generation
from auth.auth_route import auth_endpoint  # Authentication endpoints (login, register, logout)
from auth.user_route import user_endpoint  # User management endpoints

  # Import command-line interface commands
from commands.tasks import tasks_command  # CLI commands for task management
from commands.user import user_command  # CLI commands for user management
from commands.db_check import db_check_command  # CLI commands for database health checks

  # Import standard Python libraries
from pathlib import Path  # Modern path handling for file operations
import os  # Operating system interface for environment variables
import logging  # Application logging for debugging and monitoring
from datetime import datetime  # Date and time handling
from typing import Dict, Any, Tuple, Union  # Type hints for better code documentation

  # Try to import TOML parser for configuration files (handles different Python versions)
try:  # Exception handling block
    import tomllib  # Python 3.11+ built-in TOML parser
except ImportError:  # Exception handler
    try:  # Exception handling block
        import tomli as tomllib  # Fallback TOML parser for older Python versions
    except ImportError:  # Exception handler
        tomllib = None  # No TOML support available

  # Create the main Flask application instance
  # __name__ tells Flask where to find resources like templates and static files
app = Flask(__name__)  # Flask application instance

  # Configure CORS (Cross-Origin Resource Sharing) to allow frontend to connect to backend
def get_cors_origins():  # Getter method for cors_origins
    """Get allowed origins from environment variable with development fallbacks"""
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")  # Get comma-separated origins from environment
    origins = []
    
    # Parse origins and handle wildcards
    for origin in allowed_origins_str.split(","):
        origin = origin.strip()
        if origin:
            # Handle Vercel wildcard pattern
            if origin == "https://*.vercel.app":
                # For Flask-CORS, we'll handle this in the origin callback
                origins.append(origin)
            else:
                origins.append(origin)
    
    # Add localhost addresses for development if no origins specified or not in production
    if not origins or os.getenv("FLASK_ENV") != "production":
        # Common development server addresses (React dev server, Vite, etc.)
        origins.extend(["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"])
    
    return origins

def cors_origin_handler(origin):
    """Custom origin handler to support wildcards"""
    allowed_origins = get_cors_origins()
    
    # Log origin for debugging
    app.logger.info(f"CORS check for origin: {origin}")
    
    # Check exact matches first
    if origin in allowed_origins:
        app.logger.info(f"Origin allowed (exact match): {origin}")
        return True
    
    # Check wildcard patterns
    if origin and origin.endswith('.vercel.app'):
        # Allow any Vercel deployment
        app.logger.info(f"Origin allowed (Vercel): {origin}")
        return True
    
    # Allow localhost in development
    if origin and ('localhost' in origin or '127.0.0.1' in origin):
        app.logger.info(f"Origin allowed (localhost): {origin}")
        return True
    
    # Allow null origin for direct API access
    if origin is None:
        app.logger.info("Origin allowed (null/direct access)")
        return True
    
    app.logger.warning(f"Origin blocked: {origin}")
    return False

  # Configure CORS with specific settings and custom origin handler
CORS(app, 
     origins=cors_origin_handler,  # Custom function to handle wildcard origins
     supports_credentials=True,  # Allow cookies and authentication headers
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],  # Allowed HTTP headers
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])  # Allowed HTTP methods

  # Configure application logging based on environment
if os.getenv("FLASK_ENV") == "production" or os.getenv("RENDER") == "true":  # Production environment
    logging.basicConfig(
        level=logging.INFO,  # Only log INFO level and above (less verbose)
        format='%(asctime)s %(levelname)s %(name)s %(message)s'  # Structured log format with timestamp
    )
    app.logger.setLevel(logging.INFO)  # Set Flask app logger to INFO level
else:  # Development environment
    logging.basicConfig(level=logging.DEBUG)  # Log DEBUG level and above (more verbose)
    app.logger.setLevel(logging.DEBUG)  # Set Flask app logger to DEBUG level

  # Load application configuration from Config class
app.config.from_object(Config())  # Loads database settings, JWT config, file upload limits, etc.

  # Initialize Flask extensions with the app instance
swagger = Swagger(app)  # Initialize Swagger for automatic API documentation
db.init_app(app)  # Initialize SQLAlchemy database connection
ma.init_app(app)  # Initialize Marshmallow for JSON serialization/deserialization
migrate = Migrate(app, db)  # Initialize Flask-Migrate for database schema migrations
jwt = JWTManager(app)  # Initialize JWT token management for authentication


  # JWT token blacklist checker - prevents use of revoked tokens after logout
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Check if a JWT token has been revoked (blacklisted) after logout"""
    from auth.models import RevokedTokenModel  # Import token blacklist model
    return RevokedTokenModel.is_jti_blacklisted(jwt_payload["jti"])  # Check if token ID is blacklisted

  # Add security headers to every response (CORS is now handled by Flask-CORS extension)
@app.after_request  # Flask application decorator
def after_request(response):  # Function: after_request
    """Add security headers to all responses"""
  # Determine if running in production environment
    is_production = (os.getenv("RENDER") == "true" or  # Render.com deployment
                     os.getenv("FLASK_ENV") == "production")  # Production environment flag
    
  # Add caching headers for different types of API responses
    if request.endpoint and request.method == 'GET':  # Only for GET requests with defined endpoints
        if request.endpoint in ['health_check', 'index']:  # Health check and index endpoints
            response.headers['Cache-Control'] = 'public, max-age=300'  # Cache publicly for 5 minutes
        elif '/v1/books/stats' in request.path:  # Book statistics endpoint
            response.headers['Cache-Control'] = 'private, max-age=60'  # Cache privately for 1 minute
        else:  # All other endpoints
            response.headers['Cache-Control'] = 'private, no-cache, no-store, must-revalidate'  # No caching
    
  # Add security headers in production or when debug is disabled
    if is_production or not app.debug:
        response.headers['X-Content-Type-Options'] = 'nosniff'  # Prevent MIME type sniffing attacks
        response.headers['X-Frame-Options'] = 'DENY'  # Prevent clickjacking by denying iframe embedding
        response.headers['X-XSS-Protection'] = '1; mode=block'  # Enable XSS filtering in browsers
        response.headers['Strict-Transport-Security'] = (  # Force HTTPS connections
            'max-age=31536000; includeSubDomains'  # 1 year duration, include subdomains
        )
        response.headers['Referrer-Policy'] = (  # Control referrer information sent
            'strict-origin-when-cross-origin'  # Only send origin when crossing origins
        )
        
  # Additional production headers
        response.headers['X-Permitted-Cross-Domain-Policies'] = 'none'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https:; "
            "font-src 'self' data:; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
    
    return response


if not os.path.exists(os.getenv("EXPORT_FOLDER", "export_data")):
    os.makedirs(os.getenv("EXPORT_FOLDER", "export_data"))

  # Register CLI commands
app.cli.add_command(tasks_command)
app.cli.add_command(user_command)
app.cli.add_command(db_check_command)

  # Register API routes
app.register_blueprint(books_endpoint)
app.register_blueprint(profiles_endpoint)
app.register_blueprint(notes_endpoint)
app.register_blueprint(tasks_endpoint)
app.register_blueprint(files_endpoint)
app.register_blueprint(settings_endpoint)
app.register_blueprint(auth_endpoint)
app.register_blueprint(user_endpoint)


# Removed manual preflight handling - Flask-CORS extension handles this automatically


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found.'
    }), 404





@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'error': 'Bad Request',
        'message': 'The request could not be understood by the server.'
    }), 400


@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'error': 'Unauthorized',
        'message': 'Authentication required.'
    }), 401


@app.errorhandler(403)
def forbidden(error):
    return jsonify({
        'error': 'Forbidden',
        'message': 'You do not have permission to access this resource.'
    }), 403


@app.errorhandler(422)
def unprocessable_entity(error):
    return jsonify({
        'error': 'Unprocessable Entity',
        'message': ('The request was well-formed but was unable to be '
                    'followed due to semantic errors.')
    }), 422


@app.errorhandler(429)
def too_many_requests(error):
    return jsonify({
        'error': 'Too Many Requests',
        'message': 'Rate limit exceeded. Please try again later.'
    }), 429




@app.route("/")
def index() -> Dict[str, Any]:
    version = "1.4.0"
    try:
        file = Path(__file__).resolve().parent.parent / "pyproject.toml"
        if tomllib and file.exists():
            with open(file, "rb") as f:
                version = tomllib.load(f)["tool"]["poetry"]["version"]
    except Exception as e:
        app.logger.warning(f"Could not read version: {e}")

    return {
        "name": "BookVault API",
        "version": version,
        "status": "healthy",
        "description": "A personal book tracking web application API",
        "endpoints": {
            "authentication": "/v1/register, /v1/login, /v1/verify",
            "books": "/v1/books",
            "notes": "/v1/notes",
            "profiles": "/v1/profiles",
            "settings": "/v1/settings",
            "tasks": "/v1/tasks",
            "files": "/v1/files",
            "documentation": "/docs"
        },
        "features": [
            "User authentication with JWT",
            "Book management with ISBN validation",
            "Reading progress tracking",
            "Notes and reviews",
            "Data import/export",
            "Social media integration",
            "Background task processing"
        ]
    }


@app.route("/v1/csrf-token", methods=["GET"])
@jwt_required()
def get_csrf_token():
    """
    Generate CSRF token for authenticated users
    """
    import secrets
    token = secrets.token_urlsafe(32)
    return jsonify({"csrf_token": token}), 200


@app.route("/debug/routes")
def debug_routes():
    """Debug endpoint to show all registered routes"""
    if os.getenv("FLASK_ENV") != "production":
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                "rule": str(rule),
                "methods": list(rule.methods),
                "endpoint": rule.endpoint
            })
        return jsonify({
            "total_routes": len(routes),
            "routes": routes,
            "app_name": app.name,
            "debug": app.debug
        })
    else:
        return jsonify({"error": "Debug endpoint disabled in production"}), 404


@app.route("/ping")
def ping():
    """Simple ping endpoint for basic health check"""
    return jsonify({
        "status": "ok",
        "message": "BookVault API is running",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/health")
def health_check() -> Union[Dict[str, Any], Tuple[Dict[str, Any], int]]:
    status: Dict[str, Any] = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.4.0",
        "environment": os.getenv("FLASK_ENV", "development")
    }
    try:
        import time
        start = time.time()
        result = db.session.execute(db.text("SELECT version()"))
        db_version = result.scalar()
        connection_time = round((time.time() - start) * 1000, 2)
        
        database_info: Dict[str, Any] = {
            "status": "healthy",
            "connection_time_ms": connection_time,
            "version": db_version.split()[0:2] if db_version else "unknown"
        }
        status["database"] = database_info
        
  # Add connection pool info if available
        if hasattr(db.engine, "pool"):
            try:
                pool = db.engine.pool
                pool_info: Dict[str, Any] = {}
                
  # Safely get pool size
                if hasattr(pool, 'size') and callable(getattr(pool, 'size')):
                    pool_info["size"] = getattr(pool, 'size')()
                elif hasattr(pool, 'size'):
                    pool_info["size"] = getattr(pool, 'size', 0)
                else:
                    pool_info["size"] = 0
                
  # Safely get checked out connections
                if (hasattr(pool, 'checkedout') and
                        callable(getattr(pool, 'checkedout'))):
                    pool_info["checked_out"] = getattr(pool, 'checkedout')()
                elif hasattr(pool, 'checkedout'):
                    pool_info["checked_out"] = getattr(pool, 'checkedout', 0)
                else:
                    pool_info["checked_out"] = 0
                
  # Get overflow if available
                pool_info["overflow"] = getattr(pool, 'overflow', 0)
                
                status["database"]["pool"] = pool_info
            except Exception as pool_error:
                app.logger.debug(f"Could not get pool info: {pool_error}")
                status["database"]["pool"] = {"error": "Pool info unavailable"}
            
  # Warn if connection is slow
        if connection_time > 1000:  # 1 second
            status["database"]["warning"] = "Slow database connection"
            
    except Exception as e:
        app.logger.error(f"Database check failed: {e}")
        database_error: Dict[str, Any] = {
            "status": "unhealthy", 
            "error": str(e)
        }
        status["database"] = database_error
        status["status"] = "unhealthy"
        return status, 503

    try:
        from flask_jwt_extended import create_access_token
        create_access_token(identity="health")
        status["jwt"] = "healthy"
    except Exception as e:
        app.logger.error(f"JWT check failed: {e}")
        status["jwt"] = "unhealthy"
        status["status"] = "degraded"

  # Check required environment variables
    required_vars = ["AUTH_SECRET_KEY", "DATABASE_URL"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        env_error: Dict[str, Any] = {
            "status": "unhealthy",
            "missing_variables": missing,
            "message": (f"Missing required environment variables: "
                        f"{', '.join(missing)}")
        }
        status["environment"] = env_error
        status["status"] = "unhealthy"
        return status, 503
    else:
        env_healthy: Dict[str, Any] = {
            "status": "healthy",
            "variables_configured": len(required_vars)
        }
        status["environment"] = env_healthy

    return status


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': 'Method Not Allowed',
        'message': 'The method is not allowed for the requested URL'
    }), 405


@app.errorhandler(500)
def internal_server_error(error):
    app.logger.error(f'Internal server error: {error}')
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500


@app.errorhandler(503)
def service_unavailable(error):
    return jsonify({
        'error': 'Service Unavailable',
        'message': 'The service is temporarily unavailable. Please try again later.'
    }), 503


def initialize_database() -> None:
    try:
        db_url = os.getenv("DATABASE_URL", "")
        if db_url.startswith("postgres://"):
            os.environ["DATABASE_URL"] = db_url.replace(
                "postgres://", "postgresql://", 1
            )

        with app.app_context():
  # Test database connection
            db.session.execute(db.text("SELECT 1"))
            
  # Create all tables
            db.create_all()
            
  # Log database info
            result = db.session.execute(db.text("SELECT version()"))
            db_version = result.scalar()
            app.logger.info(f"Database connected successfully: {db_version}")
            
  # Check if we have any users (for monitoring)
            from models import User
            user_count = User.query.count()
            app.logger.info(
                f"Database initialized. Users in system: {user_count}"
            )
            
    except Exception as e:
        app.logger.error(f"Database initialization failed: {e}")
        db_configured = 'Yes' if os.getenv('DATABASE_URL') else 'No'
        app.logger.error(f"DATABASE_URL configured: {db_configured}")
        raise


  # Skip database initialization during import to avoid Gunicorn worker issues
  # Database will be initialized by Flask-Migrate during deployment
def init_database_if_needed():
    """Initialize database only when explicitly called"""
    if os.getenv("DATABASE_URL") and not os.getenv("SKIP_DB_INIT"):
        prod = (os.getenv("RENDER") == "true" or
                os.getenv("FLASK_ENV") == "production")
        attempts, delay, max_retries = 0, 3 if prod else 5, 5 if prod else 3

        while attempts < max_retries:
            try:
                with app.app_context():
                    initialize_database()
                    app.logger.info(
                        "Database initialization completed successfully"
                    )
                    return True
            except Exception as e:
                attempts += 1
                if attempts >= max_retries:
                    if prod:
                        app.logger.error(
                            f"Database initialization failed after {max_retries} "
                            f"attempts: {e}"
                        )
                        # Don't raise in production, let Flask-Migrate handle it
                        app.logger.warning("Continuing without DB init, Flask-Migrate will handle it")
                        return False
                    else:
                        app.logger.warning(
                            f"Skipping DB init after {max_retries} attempts: {e}"
                        )
                        return False
                else:
                    import time
                    app.logger.warning(
                        f"Database init attempt {attempts} failed, "
                        f"retrying in {delay}s: {e}"
                    )
                    time.sleep(delay)
                    delay = min(delay * 1.5, 30)
    return True

# Only run database initialization when script is run directly, not during import
if __name__ == "__main__":
    init_database_if_needed()


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

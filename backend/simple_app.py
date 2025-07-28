"""
Simple Flask Application Fallback
Used when the main application fails to start in production
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Custom CORS origin handler for fallback app
def cors_origin_handler(origin):
    """Custom origin handler to support wildcards for fallback app"""
    logger.info(f"CORS check for origin: {origin}")
    
    # Allow any Vercel deployment
    if origin and origin.endswith('.vercel.app'):
        logger.info(f"Allowing Vercel origin: {origin}")
        return True
    
    # Allow localhost in development
    if origin and ('localhost' in origin or '127.0.0.1' in origin):
        logger.info(f"Allowing localhost origin: {origin}")
        return True
    
    logger.info(f"Blocking origin: {origin}")
    return False

# Configure CORS for fallback app
CORS(app, 
     origins=cors_origin_handler,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])

@app.route('/')
def index():
    logger.info("Root endpoint accessed")
    return jsonify({
        "name": "BookVault API (Fallback)",
        "status": "running",
        "message": "Main application failed to start, using fallback",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("FLASK_ENV", "unknown"),
        "render": os.getenv("RENDER", "false")
    })

@app.route('/health')
def health():
    logger.info("Health endpoint accessed")
    return jsonify({
        "status": "healthy",
        "message": "Fallback app is running",
        "timestamp": datetime.utcnow().isoformat(),
        "fallback": True
    })

@app.route('/v1/books')
def books_fallback():
    logger.info("Books endpoint accessed (fallback)")
    return jsonify({
        "error": "Main application not available",
        "message": "This is a fallback response. The main BookVault API is not running.",
        "endpoint": "/v1/books",
        "fallback": True
    }), 503

@app.after_request
def after_request(response):
    """Add headers to responses"""
    origin = request.headers.get('Origin')
    logger.info(f"After request - Origin: {origin}, Status: {response.status_code}")
    return response

@app.errorhandler(404)
def not_found(error):
    logger.info(f"404 error for path: {request.path}")
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found in fallback app.',
        'path': request.path,
        'fallback': True
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {error}")
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An error occurred in the fallback app.',
        'fallback': True
    }), 500

if __name__ == '__main__':
    logger.info("Starting fallback app directly")
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
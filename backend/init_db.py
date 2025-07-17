#!/usr/bin/env python3
"""
Database Initialization Script for BookVault

This script initializes the PostgreSQL database for the BookVault application.
It creates all necessary tables and can be run safely multiple times.

Usage:
    python init_db.py

Environment Variables Required:
    DATABASE_URL - PostgreSQL connection string
    AUTH_SECRET_KEY - Secret key for JWT tokens
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(backend_dir))

# Import after path setup (required for module resolution)
from app import app, db  # noqa: E402
from sqlalchemy import text  # noqa: E402

# Import models to register them with SQLAlchemy (required for db.create_all())
from models import *  # noqa: E402, F401, F403
from auth.models import *  # noqa: E402, F401, F403


def init_database():
    """Initialize the database with all tables"""
    try:
        with app.app_context():
            print("\U0001F504 Initializing PostgreSQL database...")

            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")

            # Test database connection
            result = db.session.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL connection successful: {version}")

            print("\U0001F389 Database initialization completed successfully!")

    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        sys.exit(1)


def check_environment():
    """Check if required environment variables are set"""
    required_vars = ['DATABASE_URL', 'AUTH_SECRET_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"❌ Missing required environment variables: "
              f"{', '.join(missing_vars)}")
        print("Please set these variables before running the script.")
        sys.exit(1)

    db_url = os.getenv('DATABASE_URL', '')
    if not db_url.startswith('postgresql://') and \
       not db_url.startswith('postgres://'):
        prefix = db_url.split('://')[0] if '://' in db_url else 'unknown'
        print("⚠️  Warning: DATABASE_URL doesn't appear to be a "
              "PostgreSQL connection string")
        print(f"Current DATABASE_URL starts with: {prefix}")

    if db_url.startswith('postgres://'):
        fixed_url = db_url.replace('postgres://', 'postgresql://', 1)
        print("⚠️  Converting 'postgres://' to 'postgresql://' for "
              "SQLAlchemy compatibility")
        os.environ['DATABASE_URL'] = fixed_url


if __name__ == "__main__":
    print("\U0001F680 BookVault Database Initialization")
    print("=" * 40)
    check_environment()
    init_database()
#!/usr/bin/env python3
"""
PostgreSQL Database Connection Health Check Script

This script verifies the PostgreSQL database connection and provides detailed
diagnostics.
It's useful for troubleshooting database connection issues during deployment.

Usage:
    flask db-check

Environment Variables Required:
    DATABASE_URL - PostgreSQL connection string
"""

import os
import sys
import time
from flask.cli import AppGroup
from sqlalchemy import text
from db import db

db_check_command = AppGroup('db_check')


@db_check_command.command('db-check')
def check_database_connection():
    """Verify PostgreSQL database connection and provide diagnostics"""
    print("\U0001F50D PostgreSQL Database Connection Check")
    print("=" * 50)

    # Check DATABASE_URL environment variable
    database_url = os.environ.get("DATABASE_URL", "")
    if not database_url:
        print("\u274C DATABASE_URL environment variable is not set")
        sys.exit(1)

    # Mask password for display
    masked_url = database_url
    if "://" in database_url and "@" in database_url:
        parts = database_url.split("@")
        credentials = parts[0].split("://")[1]
        if ":" in credentials:
            username = credentials.split(":")[0]
            masked_url = database_url.replace(credentials, f"{username}:****")

    print(f"\U0001F4CC Database URL: {masked_url}")

    # Check URL format
    if database_url.startswith("postgres://"):
        print(
            "\u26A0\ufe0f  URL starts with 'postgres://' - will be converted "
            "to 'postgresql://' for SQLAlchemy"
        )
    elif not database_url.startswith("postgresql://"):
        print(
            "\u26A0\ufe0f  URL doesn't start with 'postgresql://' - this may "
            "cause connection issues"
        )

    # Attempt connection with timing
    print("\n\U0001F504 Attempting database connection...")
    start_time = time.time()

    try:
        # Test basic connection
        result = db.session.execute(text("SELECT 1"))
        result.scalar()
        connection_time = time.time() - start_time
        print(f"\u2705 Basic connection successful ({connection_time:.2f}s)")

        # Get PostgreSQL version
        result = db.session.execute(text("SELECT version()"))
        version = result.scalar()
        print(f"\u2705 PostgreSQL version: {version}")

        # Check connection pool status
        if hasattr(db.engine, "pool"):
            pool = db.engine.pool
            print("\n\U0001F4CA Connection Pool Status:")
            try:
                pool_info = {}
                
                # Safely get pool size
                size_attr = getattr(pool, 'size', None)
                if size_attr is not None:
                    if callable(size_attr):
                        pool_info["size"] = size_attr()
                    else:
                        pool_info["size"] = size_attr
                else:
                    pool_info["size"] = 0
                
                # Safely get checked out connections
                checkedout_attr = getattr(pool, 'checkedout', None)
                if checkedout_attr is not None:
                    if callable(checkedout_attr):
                        pool_info["checked_out"] = checkedout_attr()
                    else:
                        pool_info["checked_out"] = checkedout_attr
                else:
                    pool_info["checked_out"] = 0
                
                # Get overflow if available
                pool_info["overflow"] = getattr(pool, 'overflow', 0)
                
                print(f"  - Pool size: {pool_info['size']}")
                print(f"  - Connections in use: {pool_info['checked_out']}")
                print(f"  - Overflow: {pool_info['overflow']}")
            except Exception as e:
                print(f"  - Unable to retrieve pool status details: {e}")

        # Test query performance
        print("\n\U0001F504 Testing query performance...")
        start_time = time.time()
        db.session.execute(text("SELECT 1"))
        query_time = time.time() - start_time
        print(f"\u2705 Simple query: {query_time:.4f}s")

        # Check if tables exist by querying information_schema
        print("\n\U0001F50D Checking database tables...")
        result = db.session.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public'"
            )
        )
        tables = [row[0] for row in result]

        if tables:
            table_list = ', '.join(tables[:5])
            more_tables = (
                f" and {len(tables)-5} more..." if len(tables) > 5 else ""
            )
            print(
                f"\u2705 Found {len(tables)} tables: {table_list}{more_tables}"
            )
        else:
            print("\u26A0\ufe0f  No tables found in the database")

        print("\n\u2705 Database connection check completed successfully")

    except Exception as e:
        connection_time = time.time() - start_time
        print(
            f"\u274C Connection failed after {connection_time:.2f}s: "
            f"{str(e)}"
        )

        # Provide troubleshooting guidance
        print("\n\U0001F527 Troubleshooting suggestions:")
        print("  1. Verify DATABASE_URL is correct")
        print("  2. Check if the PostgreSQL server is running")
        print("  3. Ensure network connectivity to the database server")
        print("  4. Verify database user has proper permissions")
        print("  5. Check if database name exists")

        sys.exit(1)

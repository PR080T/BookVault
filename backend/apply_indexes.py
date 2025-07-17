#!/usr/bin/env python3
"""
Apply database indexes for BookVault
This script applies performance indexes to the PostgreSQL database
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError


def apply_indexes():
    """Apply database indexes for better performance"""
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    # Normalize Heroku-style DATABASE_URL
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        # Read indexes from file
        indexes_file = os.path.join(os.path.dirname(__file__),
                                    'database_indexes.sql')
        with open(indexes_file, 'r') as f:
            content = f.read()
        
        # Split into individual statements
        statements = [stmt.strip() for stmt in content.split(';')
                      if stmt.strip() and not stmt.strip().startswith('--')]
        
        with engine.connect() as conn:
            for statement in statements:
                if statement.startswith('CREATE INDEX'):
                    try:
                        conn.execute(text(statement))
                        index_name = statement.split()[2]  # Extract index name
                        print(f"✓ Applied index: {index_name}")
                    except ProgrammingError as e:
                        if "already exists" in str(e):
                            index_name = statement.split()[2]
                            print(f"- Index already exists: {index_name}")
                        else:
                            print(f"✗ Error applying index: {e}")
            
            conn.commit()
        
        print("Database indexes applied successfully!")
        
    except Exception as e:
        print(f"ERROR: Failed to apply indexes: {e}")
        sys.exit(1)


if __name__ == "__main__":
    apply_indexes()
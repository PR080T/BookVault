#!/usr/bin/env python3
"""
Simple test script to debug application startup issues
"""
import os
import sys
import traceback

def test_imports():
    """Test all critical imports"""
    print("Testing imports...")
    
    try:
        from flask import Flask
        print("✓ Flask import successful")
    except Exception as e:
        print(f"✗ Flask import failed: {e}")
        return False
    
    try:
        from config import Config
        print("✓ Config import successful")
    except Exception as e:
        print(f"✗ Config import failed: {e}")
        traceback.print_exc()
        return False
    
    try:
        from db import db, ma
        print("✓ Database imports successful")
    except Exception as e:
        print(f"✗ Database imports failed: {e}")
        traceback.print_exc()
        return False
    
    try:
        from models import User
        print("✓ Models import successful")
    except Exception as e:
        print(f"✗ Models import failed: {e}")
        traceback.print_exc()
        return False
    
    return True

def test_environment():
    """Test environment variables"""
    print("\nTesting environment variables...")
    
    required_vars = ["AUTH_SECRET_KEY", "DATABASE_URL"]
    missing = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✓ {var}: {'*' * min(len(value), 20)}")
        else:
            print(f"✗ {var}: Not set")
            missing.append(var)
    
    if missing:
        print(f"Missing required variables: {missing}")
        return False
    
    return True

def test_database_connection():
    """Test database connection"""
    print("\nTesting database connection...")
    
    try:
        from flask import Flask
        from config import Config
        from db import db
        
        app = Flask(__name__)
        app.config.from_object(Config())
        
        db.init_app(app)
        
        with app.app_context():
            # Test basic connection
            result = db.session.execute(db.text("SELECT 1"))
            print("✓ Database connection successful")
            
            # Test version
            result = db.session.execute(db.text("SELECT version()"))
            version = result.scalar()
            print(f"✓ Database version: {version.split()[0:2] if version else 'unknown'}")
            
            return True
            
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        traceback.print_exc()
        return False

def test_app_creation():
    """Test Flask app creation"""
    print("\nTesting Flask app creation...")
    
    try:
        # Set environment to skip DB init for this test
        os.environ["SKIP_DB_INIT"] = "true"
        
        from app import app
        print("✓ Flask app creation successful")
        
        # Test a simple route
        with app.test_client() as client:
            response = client.get('/')
            if response.status_code == 200:
                print("✓ Basic route test successful")
                return True
            else:
                print(f"✗ Basic route test failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"✗ Flask app creation failed: {e}")
        traceback.print_exc()
        return False
    finally:
        # Clean up
        if "SKIP_DB_INIT" in os.environ:
            del os.environ["SKIP_DB_INIT"]

def main():
    """Run all tests"""
    print("BookVault Application Startup Test")
    print("=" * 40)
    
    tests = [
        test_imports,
        test_environment,
        test_database_connection,
        test_app_creation
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"Test failed with exception: {e}")
            traceback.print_exc()
            results.append(False)
        print()
    
    print("Test Results:")
    print("=" * 40)
    test_names = ["Imports", "Environment", "Database", "App Creation"]
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{name}: {status}")
    
    all_passed = all(results)
    print(f"\nOverall: {'✓ ALL TESTS PASSED' if all_passed else '✗ SOME TESTS FAILED'}")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
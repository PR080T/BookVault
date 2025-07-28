#!/usr/bin/env python3
"""
CORS Configuration Test Script
This script tests the CORS configuration for the BookVault API
"""

import requests
import json
from typing import Dict, Any

def test_cors_preflight(api_url: str, origin: str) -> Dict[str, Any]:
    """Test CORS preflight request"""
    headers = {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
    
    try:
        response = requests.options(f"{api_url}/v1/books", headers=headers, timeout=10)
        
        return {
            'success': True,
            'status_code': response.status_code,
            'cors_headers': {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
            }
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def test_health_endpoint(api_url: str) -> Dict[str, Any]:
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{api_url}/health", timeout=10)
        return {
            'success': True,
            'status_code': response.status_code,
            'data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def test_root_endpoint(api_url: str) -> Dict[str, Any]:
    """Test the root endpoint to verify API is accessible"""
    try:
        response = requests.get(f"{api_url}/", timeout=10)
        return {
            'success': True,
            'status_code': response.status_code,
            'data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    # Test configuration
    api_url = "https://bookvault-api.onrender.com"  # Your Render backend URL
    test_origins = [
        "https://book-vault-kvbl49pl8-prasanna-v-bhats-projects.vercel.app",
        "https://book-vault-pi.vercel.app",
        "https://book-vault-git-main-prasanna-v-bhats-projects.vercel.app",
        "https://some-random-vercel-app.vercel.app",  # Should work with wildcard
        "https://malicious-site.com"  # Should be blocked
    ]
    
    print("🧪 BookVault CORS Configuration Test")
    print("=" * 50)
    
    # Test root endpoint first to verify API is accessible
    print("\n1. Testing Root Endpoint...")
    root_result = test_root_endpoint(api_url)
    if root_result['success']:
        print(f"✅ Root endpoint accessible: {root_result['status_code']}")
        print(f"   Response: {root_result['data']}")
    else:
        print(f"❌ Root endpoint failed: {root_result['error']}")
        print("   This suggests the API is not accessible or not deployed yet.")
        return
    
    # Test health endpoint
    print("\n2. Testing Health Endpoint...")
    health_result = test_health_endpoint(api_url)
    if health_result['success']:
        print(f"✅ Health check passed: {health_result['status_code']}")
        print(f"   Response: {health_result['data']}")
    else:
        print(f"❌ Health check failed: {health_result['error']}")
        print("   Health endpoint may not be deployed yet.")
    
    # Test CORS for each origin
    print("\n3. Testing CORS Configuration...")
    for i, origin in enumerate(test_origins, 1):
        print(f"\n   Test {i}: {origin}")
        result = test_cors_preflight(api_url, origin)
        
        if result['success']:
            cors_origin = result['cors_headers']['Access-Control-Allow-Origin']
            if cors_origin == origin:
                print(f"   ✅ CORS allowed (Status: {result['status_code']})")
                print(f"      Allow-Origin: {cors_origin}")
                print(f"      Allow-Methods: {result['cors_headers']['Access-Control-Allow-Methods']}")
                print(f"      Allow-Credentials: {result['cors_headers']['Access-Control-Allow-Credentials']}")
            elif cors_origin is None:
                print(f"   ❌ CORS blocked (Status: {result['status_code']})")
                print(f"      No Access-Control-Allow-Origin header")
            else:
                print(f"   ⚠️  Unexpected CORS response (Status: {result['status_code']})")
                print(f"      Allow-Origin: {cors_origin}")
        else:
            print(f"   ❌ Request failed: {result['error']}")
    
    print("\n" + "=" * 50)
    print("🎯 Test completed!")
    print("\nExpected results:")
    print("✅ Vercel domains should be allowed")
    print("❌ Non-Vercel domains should be blocked")

if __name__ == "__main__":
    main()
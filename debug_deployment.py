#!/usr/bin/env python3
"""
Debug script to help identify deployment issues
"""
import requests
import json
from urllib.parse import urlparse

def test_backend_urls():
    """Test various possible backend URLs"""
    possible_urls = [
        "https://bookvault-api.onrender.com",
        "https://book-vault-api.onrender.com", 
        "https://booklogr-api.onrender.com",
        "https://bookvault.onrender.com",
        # Add more variations if needed
    ]
    
    print("Testing backend URLs...")
    print("=" * 50)
    
    for url in possible_urls:
        try:
            print(f"\nTesting: {url}")
            
            # Test root endpoint
            response = requests.get(f"{url}/", timeout=10)
            print(f"  Root (/) - Status: {response.status_code}")
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"  Response: {data.get('name', 'Unknown')}")
                except:
                    print(f"  Response: {response.text[:100]}...")
            
            # Test health endpoint
            response = requests.get(f"{url}/health", timeout=10)
            print(f"  Health - Status: {response.status_code}")
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"  Health Status: {data.get('status', 'Unknown')}")
                except:
                    print(f"  Response: {response.text[:100]}...")
                    
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Connection failed - Service not found")
        except requests.exceptions.Timeout:
            print(f"  ⏱️ Timeout - Service might be slow")
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")

def test_frontend():
    """Test frontend connectivity"""
    frontend_url = "https://book-vault-kvbl49pl8-prasanna-v-bhats-projects.vercel.app"
    
    print(f"\n\nTesting frontend: {frontend_url}")
    print("=" * 50)
    
    try:
        response = requests.get(frontend_url, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Frontend is accessible")
        else:
            print(f"❌ Frontend returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend error: {str(e)}")

if __name__ == "__main__":
    test_backend_urls()
    test_frontend()
    
    print("\n" + "=" * 50)
    print("NEXT STEPS:")
    print("1. Check your Render dashboard for the actual service URL")
    print("2. Ensure your Render service is deployed and running")
    print("3. Update frontend environment variables with correct backend URL")
    print("4. Redeploy both frontend and backend if needed")
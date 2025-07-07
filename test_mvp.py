#!/usr/bin/env python3
import requests
import json
import time

def test_backend():
    base_url = "http://localhost:5000"
    
    print("🧪 Testing backend endpoints...")
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print("❌ Health check failed")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test registration
    try:
        test_user = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = requests.post(f"{base_url}/api/auth/register", json=test_user)
        if response.status_code == 201:
            print("✅ User registration passed")
            token = response.json()["access_token"]
        else:
            print(f"❌ User registration failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False
    
    # Test login
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=test_user)
        if response.status_code == 200:
            print("✅ User login passed")
        else:
            print(f"❌ User login failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Test email validation (with auth)
    try:
        headers = {"Authorization": f"Bearer {token}"}
        test_emails = {
            "emails": "test@example.com\nvalid@domain.com\ninvalid@nonexistentdomain123.com"
        }
        response = requests.post(f"{base_url}/api/validate", data=test_emails, headers=headers)
        if response.status_code == 200:
            print("✅ Email validation passed")
            result = response.json()
            print(f"   Processed {result['total_emails']} emails")
        else:
            print(f"❌ Email validation failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Validation error: {e}")
        return False
    
    print("🎉 All backend tests passed!")
    return True

if __name__ == "__main__":
    test_backend()

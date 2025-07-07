#!/usr/bin/env python3
import requests
import json
import time

def test_anonymous_validation():
    base_url = "http://localhost:5000"
    
    print("🧪 Testing anonymous email validation...")
    
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
    
    # Test anonymous validation
    try:
        test_emails = {
            "emails": "test@example.com\nvalid@domain.com\ninvalid@nonexistentdomain123.com\nusmanghias@codcrafters.org"
        }
        response = requests.post(f"{base_url}/api/validate/anonymous", data=test_emails)
        if response.status_code == 200:
            print("✅ Anonymous validation passed")
            result = response.json()
            print(f"   Processed {result['total_emails']} emails")
            print(f"   Valid: {result['statistics']['valid']}")
            print(f"   Invalid: {result['statistics']['invalid']}")
            print(f"   Unknown: {result['statistics']['unknown']}")
            return True
        else:
            print(f"❌ Anonymous validation failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Anonymous validation error: {e}")
        return False

def test_authenticated_validation():
    base_url = "http://localhost:5000"
    
    print("\n🧪 Testing authenticated email validation...")
    
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
    
    # Test authenticated validation
    try:
        headers = {"Authorization": f"Bearer {token}"}
        test_emails = {
            "emails": "test@example.com\nvalid@domain.com\ninvalid@nonexistentdomain123.com"
        }
        response = requests.post(f"{base_url}/api/validate", data=test_emails, headers=headers)
        if response.status_code == 200:
            print("✅ Authenticated validation passed")
            result = response.json()
            print(f"   Processed {result['total_emails']} emails")
            print(f"   Valid: {result['statistics']['valid']}")
            print(f"   Invalid: {result['statistics']['invalid']}")
            print(f"   Unknown: {result['statistics']['unknown']}")
            return True
        else:
            print(f"❌ Authenticated validation failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Authenticated validation error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing EmailValidator with Anonymous Support")
    print("=" * 50)
    
    # Test anonymous validation
    anonymous_success = test_anonymous_validation()
    
    # Test authenticated validation
    auth_success = test_authenticated_validation()
    
    print("\n" + "=" * 50)
    if anonymous_success and auth_success:
        print("🎉 All tests passed! EmailValidator is working correctly.")
    else:
        print("❌ Some tests failed. Please check the logs above.") 
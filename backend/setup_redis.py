#!/usr/bin/env python3
"""
Simple Redis setup script for email validation caching
This script helps set up Redis for improved performance
"""

import subprocess
import sys
import os

def check_redis_installed():
    """Check if Redis is installed"""
    try:
        result = subprocess.run(['redis-server', '--version'], 
                              capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def install_redis_ubuntu():
    """Install Redis on Ubuntu/Debian"""
    print("🔧 Installing Redis on Ubuntu/Debian...")
    try:
        subprocess.run(['sudo', 'apt', 'update'], check=True)
        subprocess.run(['sudo', 'apt', 'install', '-y', 'redis-server'], check=True)
        subprocess.run(['sudo', 'systemctl', 'enable', 'redis-server'], check=True)
        subprocess.run(['sudo', 'systemctl', 'start', 'redis-server'], check=True)
        print("✅ Redis installed and started successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Redis: {e}")
        return False

def install_redis_macos():
    """Install Redis on macOS using Homebrew"""
    print("🔧 Installing Redis on macOS...")
    try:
        subprocess.run(['brew', 'install', 'redis'], check=True)
        subprocess.run(['brew', 'services', 'start', 'redis'], check=True)
        print("✅ Redis installed and started successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Redis: {e}")
        return False

def test_redis_connection():
    """Test Redis connection"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis connection test successful!")
        return True
    except Exception as e:
        print(f"❌ Redis connection test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Redis Setup for Email Validation System")
    print("=" * 50)
    
    # Check if Redis is already installed
    if check_redis_installed():
        print("✅ Redis is already installed!")
        if test_redis_connection():
            print("🎉 Redis is ready to use!")
            return True
        else:
            print("⚠️ Redis is installed but not running. Starting...")
            try:
                subprocess.run(['sudo', 'systemctl', 'start', 'redis-server'], check=True)
                if test_redis_connection():
                    print("🎉 Redis is now running!")
                    return True
            except:
                pass
    
    # Detect OS and install Redis
    if sys.platform.startswith('linux'):
        if install_redis_ubuntu():
            return test_redis_connection()
    elif sys.platform.startswith('darwin'):  # macOS
        if install_redis_macos():
            return test_redis_connection()
    else:
        print("❌ Unsupported operating system")
        print("Please install Redis manually:")
        print("  - Ubuntu/Debian: sudo apt install redis-server")
        print("  - macOS: brew install redis")
        print("  - Windows: Download from https://redis.io/download")
    
    return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Redis setup completed successfully!")
        print("Your email validation system will now use Redis for caching.")
    else:
        print("\n❌ Redis setup failed.")
        print("The system will work without Redis, but performance may be slower.")
        print("You can run this script again later to set up Redis.") 
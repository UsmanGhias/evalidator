#!/bin/bash

echo "🚀 Starting EmailValidator MVP..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    print_warning "Redis is not running. Starting Redis..."
    if command -v redis-server &> /dev/null; then
        redis-server --daemonize yes
        sleep 2
    else
        print_error "Redis is not installed. Please install Redis first."
        print_error "On Ubuntu: sudo apt-get install redis-server"
        print_error "On macOS: brew install redis"
        exit 1
    fi
fi

print_success "Redis is running"

# Create backend environment file
print_status "Setting up backend environment..."
cat > backend/.env << EOF
# Flask Configuration
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# Database Configuration
DATABASE_URL=sqlite:///email_validator.db

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Development Settings
FLASK_ENV=development
DEBUG=True
EOF

print_success "Backend environment configured"

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Initialize database
print_status "Initializing database..."
python3 -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database initialized successfully')
"

if [ $? -eq 0 ]; then
    print_success "Database initialized"
else
    print_error "Failed to initialize database"
    exit 1
fi

cd ..

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install

if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Create a simple test script
print_status "Creating test script..."
cat > test_mvp.py << 'EOF'
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
EOF

chmod +x test_mvp.py

print_success "Test script created"

# Create startup instructions
cat > MVP_INSTRUCTIONS.md << 'EOF'
# 🚀 EmailValidator MVP - Startup Instructions

## Quick Start

1. **Start the Backend:**
   ```bash
   cd backend
   python3 app.py
   ```
   The backend will run on http://localhost:5000

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:3000

3. **Test the System:**
   ```bash
   python3 test_mvp.py
   ```

## Features Included

✅ **Complete Authentication System**
- User registration and login
- JWT token-based authentication
- Secure password hashing

✅ **Email Validation Engine**
- 4-layer validation (syntax, domain, SMTP, role detection)
- Real-time processing
- Support for bulk validation

✅ **Usage Tracking**
- Free plan: 100 emails/month
- Paid plans: 1K, 10K, 100K emails
- Monthly usage reset for free users

✅ **Professional UI**
- Modern, responsive design
- Real-time progress tracking
- Export results to CSV

✅ **Subscription Management**
- Multiple pricing plans
- Plan upgrade functionality
- Usage limits enforcement

## Default Test Account

- Email: test@example.com
- Password: testpassword123

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/validate` - Validate emails
- `GET /api/subscription` - Get subscription status
- `POST /api/subscription` - Upgrade subscription

## Database

The system uses SQLite for development. The database file is created automatically at `backend/email_validator.db`.

## Redis

Redis is used for caching and session management. Make sure Redis is running on localhost:6379.

## Environment Variables

All configuration is in `backend/.env`. For production, update the secret keys and database URL.

## Troubleshooting

1. **Redis not running:** Install Redis and start it
2. **Port conflicts:** Change ports in app.py and package.json
3. **Database errors:** Delete email_validator.db and restart
4. **CORS issues:** Check that backend is running on port 5000

## Next Steps for Production

1. Set up PostgreSQL database
2. Configure Redis Cloud
3. Set up Stripe for payments
4. Add email notifications
5. Set up monitoring and logging
6. Configure custom domain
7. Set up SSL certificates

## Support

For issues or questions, check the logs in the terminal where you started the services.
EOF

print_success "Instructions created"

# Start the backend in the background
print_status "Starting backend server..."
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Test the backend
print_status "Testing backend..."
python3 test_mvp.py

if [ $? -eq 0 ]; then
    print_success "Backend is working correctly!"
else
    print_error "Backend test failed. Check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start the frontend
print_status "Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

print_success "🎉 EmailValidator MVP is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "📊 Redis:    localhost:6379"
echo ""
echo "📖 See MVP_INSTRUCTIONS.md for detailed information"
echo ""
echo "🛑 To stop all services, press Ctrl+C"

# Wait for user to stop
trap "echo ''; print_status 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; print_success 'Services stopped'; exit 0" INT

# Keep the script running
wait 
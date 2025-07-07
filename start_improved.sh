#!/bin/bash

echo "🚀 Starting Improved EmailValidator..."

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
python3 test_anonymous.py

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

print_success "🎉 Improved EmailValidator is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "📊 Redis:    localhost:6379"
echo ""
echo "✨ New Features:"
echo "   • Anonymous validation (10 emails free)"
echo "   • Fixed authentication modal"
echo "   • Improved UI/UX"
echo "   • Better error handling"
echo ""
echo "📖 See IMPROVEMENTS_SUMMARY.md for detailed information"
echo ""
echo "🛑 To stop all services, press Ctrl+C"

# Wait for user to stop
trap "echo ''; print_status 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; print_success 'Services stopped'; exit 0" INT

# Keep the script running
wait 
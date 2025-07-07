#!/bin/bash

# Enhanced Email Validation System Startup Script
# Includes Redis caching for improved performance

echo "🚀 Starting Enhanced Email Validation System"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[HEADER]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/app.py" ] || [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_header "Step 1: Checking Dependencies"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi
print_status "Python 3 found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi
print_status "Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed"
    exit 1
fi
print_status "npm found: $(npm --version)"

print_header "Step 2: Setting up Redis for Caching"

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    print_warning "Redis not found. Setting up Redis for improved performance..."
    cd backend
    python3 setup_redis.py
    cd ..
else
    # Test Redis connection
    if redis-cli ping &> /dev/null; then
        print_status "Redis is running and accessible"
    else
        print_warning "Redis is installed but not running. Starting Redis..."
        sudo systemctl start redis-server 2>/dev/null || brew services start redis 2>/dev/null || true
    fi
fi

print_header "Step 3: Backend Setup"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Initialize database
print_status "Initializing database..."
python3 init_db.py

# Start backend server
print_status "Starting backend server..."
python3 app.py &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid

cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    print_status "Backend server started successfully on http://localhost:5000"
else
    print_error "Backend server failed to start"
    exit 1
fi

print_header "Step 4: Frontend Setup"

cd frontend

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Start frontend server
print_status "Starting frontend server..."
npm start &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid

cd ..

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend server started successfully on http://localhost:3000"
else
    print_warning "Frontend server may still be starting up..."
fi

print_header "Step 5: System Status"

echo ""
echo "🎉 Enhanced Email Validation System is now running!"
echo ""
echo "📊 System Information:"
echo "   • Backend API: http://localhost:5000"
echo "   • Frontend App: http://localhost:3000"
echo "   • Health Check: http://localhost:5000/api/health"
echo "   • Redis Caching: $(redis-cli ping 2>/dev/null | grep -q PONG && echo 'Active' || echo 'Not available')"
echo ""
echo "🔧 Features:"
echo "   • Professional SMTP validation with RCPT TO handshake"
echo "   • DNS MX record validation with caching"
echo "   • Catch-all domain detection"
echo "   • Role email identification"
echo "   • Redis caching for improved performance"
echo "   • 93% accuracy for free tier"
echo ""
echo "📝 Usage:"
echo "   • Anonymous users: Up to 10 emails (no signup required)"
echo "   • Registered users: Plan-based limits with higher accuracy"
echo "   • API access: Available for authenticated users"
echo ""
echo "🛑 To stop the system:"
echo "   ./stop_service.sh"
echo ""
echo "📋 To view logs:"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/frontend.log"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Save startup information
echo "System started at: $(date)" > logs/startup.log
echo "Backend PID: $BACKEND_PID" >> logs/startup.log
echo "Frontend PID: $FRONTEND_PID" >> logs/startup.log

print_status "System startup completed successfully!" 
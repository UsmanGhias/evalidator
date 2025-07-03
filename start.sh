#!/bin/bash

echo "🚀 Starting Email Validation SaaS..."

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   sudo systemctl start redis"
    echo "   or"
    echo "   redis-server"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    pkill -f "python app.py"
    pkill -f "celery -A worker"
    pkill -f "npm start"
    exit 0
}

# Set cleanup trap
trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting Flask backend..."
cd backend
python app.py &
BACKEND_PID=$!

# Start Celery worker
echo "🔄 Starting Celery worker..."
celery -A worker worker --loglevel=info &
WORKER_PID=$!

# Start frontend
echo "🎨 Starting React frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:5000"
echo "📊 Redis: localhost:6379"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait 
#!/bin/bash

echo "🔧 Setting up Email Validation SaaS..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "❌ Redis is not installed. Please install Redis first:"
    echo "   Ubuntu/Debian: sudo apt-get install redis-server"
    echo "   macOS: brew install redis"
    exit 1
fi

# Create backend environment file
echo "📝 Creating backend environment file..."
cat > backend/.env << EOL
FLASK_ENV=development
REDIS_URL=redis://localhost:6379/0
UPLOAD_FOLDER=uploads
SECRET_KEY=dev-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOL

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd backend
pip3 install -r requirements.txt
cd ..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p backend/uploads

# Start Redis if not running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "🔄 Starting Redis server..."
    redis-server --daemonize yes
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   ./start.sh"
echo ""
echo "📚 Or start services manually:"
echo "   Backend: cd backend && python app.py"
echo "   Worker:  cd backend && celery -A worker worker --loglevel=info"
echo "   Frontend: cd frontend && npm start" 
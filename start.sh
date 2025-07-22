#!/bin/bash

echo "🚀 Starting EMRS Dornala School Website..."
echo "================================================"

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use. Please stop the service using that port."
        return 1
    fi
    return 0
}

# Check if required ports are available
echo "🔍 Checking port availability..."
if ! check_port 5000; then
    echo "❌ Backend port 5000 is in use"
    exit 1
fi

if ! check_port 3000; then
    echo "❌ Frontend port 3000 is in use"
    exit 1
fi

# Check if MongoDB is running (optional check)
echo "🔍 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is available"
else
    echo "⚠️  MongoDB not found. Make sure MongoDB is installed and running."
    echo "   You can use MongoDB Atlas cloud database as an alternative."
fi

# Start backend server
echo "🔧 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
echo "✅ Backend server started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "✅ Frontend server started with PID: $FRONTEND_PID"

echo ""
echo "🎉 EMRS Dornala School Website is now running!"
echo "================================================"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "💚 Health Check: http://localhost:5000/api/health"
echo ""
echo "🛑 To stop the servers, press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped successfully"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
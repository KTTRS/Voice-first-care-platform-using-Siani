#!/bin/bash

set -e

echo "🚀 Starting Sainte Development Environment..."
echo ""

# Load environment variables
if [ -f packages/backend/.env ]; then
    export $(cat packages/backend/.env | grep -v '^#' | xargs)
fi

# Function to check if a port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    echo "⏳ Waiting for $service..."
    for i in {1..30}; do
        if timeout 1 bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null; then
            echo "✅ $service is ready"
            return 0
        fi
        sleep 1
    done
    echo "❌ $service failed to start"
    return 1
}

# Stop any existing backend processes
echo "🛑 Stopping existing backend processes..."
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start infrastructure services (PostgreSQL, Redis, Weaviate)
echo ""
echo "🔧 Starting infrastructure services..."
docker-compose up -d postgres redis weaviate

# Wait for services
wait_for_service localhost 5432 "PostgreSQL"
wait_for_service localhost 6379 "Redis"
wait_for_service localhost 8080 "Weaviate"

# Run database migrations
echo ""
echo "📊 Running database migrations..."
cd packages/backend
npx prisma migrate deploy
cd ../..

# Start backend in background
echo ""
echo "🚀 Starting backend server..."
cd packages/backend
npm run dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
sleep 3
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend started (PID: $BACKEND_PID)"
else
    echo "❌ Backend failed to start. Check backend.log"
    tail -20 backend.log
    exit 1
fi

# Start dashboard in background
echo ""
echo "🎨 Starting dashboard..."
cd packages/dashboard
npm run dev > ../../dashboard.log 2>&1 &
DASHBOARD_PID=$!
cd ../..

sleep 3
if kill -0 $DASHBOARD_PID 2>/dev/null; then
    echo "✅ Dashboard started (PID: $DASHBOARD_PID)"
else
    echo "❌ Dashboard failed to start. Check dashboard.log"
    tail -20 dashboard.log
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Sainte Platform is RUNNING! ✨"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Services:"
echo "  📊 Dashboard:   http://localhost:3001"
echo "  🚀 Backend API: http://localhost:3000"
echo "  🗄️  PostgreSQL:  localhost:5432"
echo "  🔴 Redis:       localhost:6379"
echo "  🔍 Weaviate:    localhost:8080"
echo ""
echo "📝 Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Dashboard: tail -f dashboard.log"
echo ""
echo "🛑 Stop:"
echo "  ./stop.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save PIDs for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$DASHBOARD_PID" > .dashboard.pid

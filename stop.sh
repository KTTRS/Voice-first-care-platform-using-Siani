#!/bin/bash

echo "🛑 Stopping Sainte Platform..."

# Kill backend
if [ -f .backend.pid ]; then
    kill $(cat .backend.pid) 2>/dev/null || true
    rm .backend.pid
fi

# Kill dashboard
if [ -f .dashboard.pid ]; then
    kill $(cat .dashboard.pid) 2>/dev/null || true
    rm .dashboard.pid
fi

# Kill any remaining processes
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Stop Docker containers
docker-compose down

echo "✅ All services stopped"

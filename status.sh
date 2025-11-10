#!/bin/bash

echo "📊 Sainte Platform Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Docker services
echo "🐳 Docker Services:"
docker-compose ps

echo ""
echo "🔌 Node Services:"

# Check backend
if lsof -i:3000 > /dev/null 2>&1; then
    echo "  ✅ Backend (port 3000): RUNNING"
else
    echo "  ❌ Backend (port 3000): STOPPED"
fi

# Check dashboard
if lsof -i:3001 > /dev/null 2>&1; then
    echo "  ✅ Dashboard (port 3001): RUNNING"
else
    echo "  ❌ Dashboard (port 3001): STOPPED"
fi

echo ""
echo "💾 Recent Logs:"
echo ""
echo "Backend (last 5 lines):"
tail -5 backend.log 2>/dev/null || echo "  No logs found"
echo ""
echo "Dashboard (last 5 lines):"
tail -5 dashboard.log 2>/dev/null || echo "  No logs found"

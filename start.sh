#!/bin/bash

echo "🚀 Starting Sainte Platform..."

# Load environment variables
if [ -f packages/backend/.env ]; then
    export $(cat packages/backend/.env | grep -v '^#' | xargs)
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start all services
echo "🔧 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Platform is starting!"
echo ""
echo "Services:"
echo "  🗄️  PostgreSQL: localhost:5432"
echo "  🔴 Redis: localhost:6379"
echo "  🔍 Weaviate: localhost:8080"
echo "  🚀 Backend API: localhost:3000"
echo ""
echo "View logs: docker-compose logs -f"
echo "Stop all: docker-compose down"

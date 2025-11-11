#!/bin/bash

set -e

echo "🚀 Sainte Platform - Automated Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is installed and running"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) is installed"

echo ""
echo "📦 Step 1: Installing dependencies..."
echo "======================================"
npm install
print_success "Dependencies installed"

echo ""
echo "🔧 Step 2: Setting up environment files..."
echo "======================================"

# Backend .env
if [ ! -f packages/backend/.env ]; then
    print_info "Creating backend .env file..."
    cat > packages/backend/.env << 'EOF'
# Database connection (using local Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sainte_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
REDIS_URL="redis://localhost:6379"

# OpenAI Configuration
OPENAI_API_KEY=""

# Transcription Service Configuration
# Strategy: "openai" | "local" | "hybrid"
TRANSCRIPTION_STRATEGY="local"

# Local Whisper Configuration
LOCAL_WHISPER_URL="http://localhost:8000/transcribe"
LOCAL_WHISPER_TIMEOUT="30000"

# Privacy Settings
DELETE_AUDIO_AFTER_TRANSCRIPTION="true"

# Weaviate Configuration (using local Docker Weaviate)
WEAVIATE_URL="http://localhost:8080"
WEAVIATE_API_KEY=""
EOF
    print_success "Backend .env created"
else
    print_warning "Backend .env already exists, skipping"
fi

# Dashboard .env
if [ ! -f packages/dashboard/.env ]; then
    print_info "Creating dashboard .env file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > packages/dashboard/.env
    print_success "Dashboard .env created"
else
    print_warning "Dashboard .env already exists, skipping"
fi

# Mobile .env
if [ ! -f packages/mobile/.env ]; then
    print_info "Creating mobile .env file..."
    echo "EXPO_PUBLIC_API_URL=http://localhost:3000" > packages/mobile/.env
    print_success "Mobile .env created"
else
    print_warning "Mobile .env already exists, skipping"
fi

echo ""
echo "🐳 Step 3: Starting Docker services..."
echo "======================================"

# Stop any existing containers
docker compose down 2>/dev/null || true

# Start services
docker compose up -d postgres redis weaviate

print_info "Waiting for services to be healthy..."
sleep 5

# Check if services are running
if docker compose ps | grep -q "healthy"; then
    print_success "Docker services are running"
else
    print_warning "Some services may not be fully ready yet"
fi

echo ""
echo "📊 Step 4: Setting up database..."
echo "======================================"

cd packages/backend

print_info "Generating Prisma client..."
npm run prisma:generate
print_success "Prisma client generated"

print_info "Running database migrations..."
npm run prisma:migrate
print_success "Database migrations completed"

print_info "Seeding database with test data..."
npm run prisma:seed
print_success "Database seeded"

cd ../..

echo ""
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "📝 Test Credentials:"
echo "  Admin:     admin@sainte.ai / admin123"
echo "  Doctor:    doctor@sainte.ai / doctor123"
echo "  Nurse:     nurse@sainte.ai / nurse123"
echo "  Patient 1: john.doe@example.com / patient123"
echo "  Patient 2: jane.smith@example.com / patient123"
echo ""
echo "🚀 To start the platform:"
echo "  ./dev.sh              # Start backend + dashboard"
echo "  ./start.sh            # Start Docker services only"
echo ""
echo "📊 Individual services:"
echo "  npm run dev:backend   # Backend API (port 3000)"
echo "  npm run dev:dashboard # Dashboard (port 3001)"
echo "  npm run dev:mobile    # Mobile app"
echo ""
echo "🔍 Check status:"
echo "  ./status.sh"
echo "  docker compose ps"
echo ""
echo "🛑 Stop services:"
echo "  ./stop.sh"
echo "  docker compose down"
echo ""
print_success "Platform is ready to use!"

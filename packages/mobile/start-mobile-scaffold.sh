#!/bin/bash

# Siani Mobile - Quick Start Script
# Sets up the mobile app and runs development server

set -e

echo "🎨 Siani Mobile - Voice-First Companion"
echo "========================================"
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
  echo ""
else
  echo "✅ Dependencies already installed"
  echo ""
fi

# Check for .env file
if [ ! -f ".env" ]; then
  echo "⚠️  No .env file found. Creating from example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚙️  Please update .env with your API URL and keys"
    echo ""
  else
    echo "❌ No .env.example found"
    exit 1
  fi
else
  echo "✅ Environment file exists"
  echo ""
fi

# Display current configuration
echo "📍 Configuration:"
if [ -f ".env" ]; then
  grep -v "^#" .env | grep -v "^$" || true
fi
echo ""

# Check backend connection
echo "🔌 Checking backend connection..."
API_URL=$(grep API_URL .env | cut -d '=' -f2)
if curl -s "${API_URL}/health" > /dev/null 2>&1; then
  echo "✅ Backend is running at ${API_URL}"
else
  echo "⚠️  Backend not responding at ${API_URL}"
  echo "   Make sure the backend is running: cd ../backend && npm run dev"
fi
echo ""

# TypeScript check (optional, can be slow)
# echo "🔍 Checking TypeScript..."
# npx tsc --noEmit
# echo "✅ TypeScript check passed"
# echo ""

echo "🚀 Starting Expo development server..."
echo ""
echo "📱 Scan QR code with Expo Go app on your phone"
echo "   iOS: Camera app"
echo "   Android: Expo Go app"
echo ""
echo "⌨️  Press commands:"
echo "   - Press 'a' for Android emulator"
echo "   - Press 'i' for iOS simulator (Mac only)"
echo "   - Press 'w' for web browser"
echo "   - Press 'r' to reload"
echo ""

# Start Expo
npm run dev

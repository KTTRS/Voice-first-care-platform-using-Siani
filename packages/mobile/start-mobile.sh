#!/bin/bash

# Mobile App Quick Start Script
# This script starts the Expo development server

set -e

echo "🚀 Starting Sainte Mobile App..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Clear Metro bundler cache
echo "🧹 Clearing Metro cache..."
npx expo start --clear

# The above command will:
# - Clear the Metro bundler cache
# - Start the Expo development server
# - Show QR code for Expo Go app
# - Allow you to press 'i' for iOS simulator
# - Allow you to press 'a' for Android emulator
# - Allow you to press 'w' for web browser

#!/bin/bash

# Whisper Transcription Service - Quick Start
# This script helps you get started with the transcription service

set -e

echo "🎙️  Siani Whisper Transcription - Quick Start"
echo "=============================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Ask user for deployment strategy
echo "🚀 Which transcription strategy do you want to use?"
echo ""
echo "1) OpenAI Whisper API (easiest, requires API key)"
echo "2) Local Whisper (HIPAA-compliant, requires GPU)"
echo "3) Hybrid (local with OpenAI fallback)"
echo ""
read -p "Enter your choice (1-3): " strategy_choice

case $strategy_choice in
    1)
        STRATEGY="openai"
        echo ""
        echo "📝 OpenAI Whisper API selected"
        echo ""
        read -p "Enter your OpenAI API key: " openai_key
        
        if [ -z "$openai_key" ]; then
            echo "❌ API key required"
            exit 1
        fi
        
        # Update .env
        cd packages/backend
        if [ ! -f .env ]; then
            cp .env.example .env
        fi
        
        # Update environment variables
        sed -i.bak "s/TRANSCRIPTION_STRATEGY=.*/TRANSCRIPTION_STRATEGY=openai/" .env
        sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
        
        echo "✅ Configuration saved to packages/backend/.env"
        echo ""
        echo "🚀 Starting backend..."
        npm run dev
        ;;
        
    2)
        STRATEGY="local"
        echo ""
        echo "🐳 Building local Whisper Docker image..."
        
        cd packages/backend/whisper-service
        docker build -t siani-whisper .
        
        echo "✅ Docker image built"
        echo ""
        
        # Check for GPU
        if command_exists nvidia-smi; then
            echo "✅ GPU detected"
            GPU_FLAGS="--gpus all"
        else
            echo "⚠️  No GPU detected, using CPU mode (slower)"
            GPU_FLAGS="-e USE_CPU=true"
        fi
        
        # Run container
        echo "🚀 Starting Whisper service..."
        docker run -d \
            --name siani-whisper \
            $GPU_FLAGS \
            -p 8000:8000 \
            -e WHISPER_MODEL=medium \
            siani-whisper
        
        echo "✅ Whisper service started on port 8000"
        echo ""
        
        # Wait for service to be healthy
        echo "⏳ Waiting for service to be ready..."
        sleep 10
        
        # Health check
        if curl -f http://localhost:8000/health 2>/dev/null; then
            echo "✅ Whisper service is healthy"
        else
            echo "⚠️  Service may still be starting. Check with: docker logs siani-whisper"
        fi
        
        echo ""
        
        # Update backend .env
        cd ../../
        if [ ! -f .env ]; then
            cp .env.example .env
        fi
        
        sed -i.bak "s/TRANSCRIPTION_STRATEGY=.*/TRANSCRIPTION_STRATEGY=local/" .env
        sed -i.bak "s/LOCAL_WHISPER_URL=.*/LOCAL_WHISPER_URL=http:\/\/localhost:8000\/transcribe/" .env
        
        echo "✅ Configuration saved"
        echo ""
        echo "🚀 Starting backend..."
        npm run dev
        ;;
        
    3)
        STRATEGY="hybrid"
        echo ""
        echo "🔄 Hybrid strategy selected (local + OpenAI fallback)"
        echo ""
        
        read -p "Enter your OpenAI API key: " openai_key
        
        if [ -z "$openai_key" ]; then
            echo "❌ API key required for fallback"
            exit 1
        fi
        
        # Build and run local Whisper
        echo ""
        echo "🐳 Building local Whisper Docker image..."
        cd packages/backend/whisper-service
        docker build -t siani-whisper .
        
        if command_exists nvidia-smi; then
            GPU_FLAGS="--gpus all"
        else
            GPU_FLAGS="-e USE_CPU=true"
        fi
        
        docker run -d \
            --name siani-whisper \
            $GPU_FLAGS \
            -p 8000:8000 \
            -e WHISPER_MODEL=medium \
            siani-whisper
        
        echo "✅ Whisper service started"
        sleep 10
        
        # Update backend .env
        cd ../../
        if [ ! -f .env ]; then
            cp .env.example .env
        fi
        
        sed -i.bak "s/TRANSCRIPTION_STRATEGY=.*/TRANSCRIPTION_STRATEGY=hybrid/" .env
        sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
        sed -i.bak "s/LOCAL_WHISPER_URL=.*/LOCAL_WHISPER_URL=http:\/\/localhost:8000\/transcribe/" .env
        
        echo "✅ Hybrid strategy configured"
        echo ""
        echo "🚀 Starting backend..."
        npm run dev
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test the transcription service:"
echo "   curl http://localhost:3000/api/voice/health"
echo ""
echo "2. Upload a test audio file:"
echo "   curl -X POST http://localhost:3000/api/voice/transcribe \\"
echo "     -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "     -F \"audio=@test-audio.m4a\""
echo ""
echo "3. Check logs:"
if [ "$STRATEGY" = "local" ] || [ "$STRATEGY" = "hybrid" ]; then
    echo "   - Whisper service: docker logs siani-whisper"
fi
echo "   - Backend: Check terminal output"
echo ""
echo "🎉 Happy transcribing!"

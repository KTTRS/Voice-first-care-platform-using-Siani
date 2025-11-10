#!/bin/bash

# Test Whisper Transcription Service
# Quick verification that transcription is working

set -e

echo "🧪 Testing Whisper Transcription Service"
echo "========================================="
echo ""

# Check if backend is running
echo "1️⃣  Checking if backend is running..."
if curl -f http://localhost:3000/health 2>/dev/null >/dev/null; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is not running on port 3000"
    echo "   Please start it with: npm run dev"
    exit 1
fi

echo ""

# Check transcription service health
echo "2️⃣  Checking transcription service health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/voice/health)
echo "   Response: $HEALTH_RESPONSE"

HEALTHY=$(echo $HEALTH_RESPONSE | grep -o '"healthy":true' || true)
if [ -n "$HEALTHY" ]; then
    echo "   ✅ Transcription service is healthy"
    
    STRATEGY=$(echo $HEALTH_RESPONSE | grep -o '"strategy":"[^"]*"' | cut -d'"' -f4)
    echo "   Strategy: $STRATEGY"
    
    OPENAI_STATUS=$(echo $HEALTH_RESPONSE | grep -o '"openai":[^,}]*' | cut -d':' -f2)
    LOCAL_STATUS=$(echo $HEALTH_RESPONSE | grep -o '"local":[^,}]*' | cut -d':' -f2)
    
    echo "   OpenAI available: $OPENAI_STATUS"
    echo "   Local available: $LOCAL_STATUS"
else
    echo "   ⚠️  Transcription service may not be properly configured"
    echo "   Check your .env file and make sure OPENAI_API_KEY is set"
fi

echo ""

# Check if local Whisper is running (if applicable)
if docker ps | grep -q siani-whisper; then
    echo "3️⃣  Checking local Whisper service..."
    if curl -f http://localhost:8000/health 2>/dev/null >/dev/null; then
        echo "   ✅ Local Whisper is running on port 8000"
        
        # Get model info
        WHISPER_HEALTH=$(curl -s http://localhost:8000/health)
        echo "   $WHISPER_HEALTH"
    else
        echo "   ⚠️  Local Whisper container is running but not responding"
        echo "   Check logs: docker logs siani-whisper"
    fi
else
    echo "3️⃣  Local Whisper service: Not running (using cloud API)"
fi

echo ""
echo "========================================="
echo "✅ Health check complete"
echo ""
echo "📝 To test transcription with an audio file:"
echo ""
echo "curl -X POST http://localhost:3000/api/voice/transcribe \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -F \"audio=@path/to/your-audio.m4a\""
echo ""
echo "🔑 Get a JWT token by logging in first:"
echo ""
echo "curl -X POST http://localhost:3000/api/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"password\"}'"
echo ""

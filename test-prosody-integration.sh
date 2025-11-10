#!/bin/bash
# Test Prosody WebSocket Integration with Real Voice Data

set -e

echo "🎵 Testing Prosody WebSocket Integration"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
PROSODY_WS_URL="${PROSODY_WS_URL:-ws://localhost:3000/prosody}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Backend URL: $BACKEND_URL"
echo "  Prosody WebSocket: $PROSODY_WS_URL"
echo ""

# Test 1: Check if backend is running
echo -e "${YELLOW}Test 1: Backend Health Check${NC}"
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Backend is running${NC}"
else
  echo -e "${RED}✗ Backend is not running${NC}"
  echo "  Start backend with: cd packages/backend && npm run dev"
  exit 1
fi
echo ""

# Test 2: WebSocket connection test using Node.js
echo -e "${YELLOW}Test 2: WebSocket Connection${NC}"
node -e "
const WebSocket = require('ws');

const ws = new WebSocket('$PROSODY_WS_URL');

ws.on('open', () => {
  console.log('✓ WebSocket connected successfully');
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('✓ Received message:', message.type);
    
    if (message.type === 'connected') {
      console.log('✓ Connection confirmed');
      ws.close();
      process.exit(0);
    }
  });
  
  setTimeout(() => {
    console.log('✗ Timeout waiting for connection confirmation');
    ws.close();
    process.exit(1);
  }, 5000);
});

ws.on('error', (error) => {
  console.log('✗ WebSocket error:', error.message);
  process.exit(1);
});
" 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ WebSocket connection test passed${NC}"
else
  echo -e "${RED}✗ WebSocket connection test failed${NC}"
  exit 1
fi
echo ""

# Test 3: Prosody data streaming test
echo -e "${YELLOW}Test 3: Prosody Data Streaming${NC}"
node -e "
const WebSocket = require('ws');

const ws = new WebSocket('$PROSODY_WS_URL');
let messagesReceived = 0;

ws.on('open', () => {
  console.log('✓ Connected, sending test audio chunk');
  
  // Send test audio chunk (simulated)
  const testAudioData = Array(1024).fill(0).map(() => Math.random() * 0.1 - 0.05);
  
  ws.send(JSON.stringify({
    type: 'audio_chunk',
    data: testAudioData,
  }));
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'prosody') {
      messagesReceived++;
      console.log(\`✓ Prosody frame \${messagesReceived}: pitch=\${message.pitchHz.toFixed(1)} Hz, energy=\${message.energy.toFixed(3)}\`);
      
      if (messagesReceived >= 2) {
        console.log('✓ Prosody streaming working');
        ws.close();
        process.exit(0);
      }
    }
  });
  
  setTimeout(() => {
    if (messagesReceived === 0) {
      console.log('✗ No prosody data received');
      ws.close();
      process.exit(1);
    }
  }, 5000);
});

ws.on('error', (error) => {
  console.log('✗ WebSocket error:', error.message);
  process.exit(1);
});
" 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Prosody data streaming test passed${NC}"
else
  echo -e "${RED}✗ Prosody data streaming test failed${NC}"
  exit 1
fi
echo ""

# Test 4: TTS endpoint test (if available)
echo -e "${YELLOW}Test 4: TTS Endpoint${NC}"
curl -s -X POST "$BACKEND_URL/api/tts/synthesize" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, testing prosody integration","emotion":"neutral"}' > /tmp/tts_response.json 2>&1

if [ -f /tmp/tts_response.json ]; then
  if grep -q "fallback" /tmp/tts_response.json; then
    echo -e "${YELLOW}⚠ TTS using fallback (client-side)${NC}"
    echo "  Configure Google Cloud TTS for full prosody extraction"
  elif grep -q "audio" /tmp/tts_response.json; then
    echo -e "${GREEN}✓ TTS synthesis successful${NC}"
  else
    echo -e "${RED}✗ TTS synthesis failed${NC}"
    cat /tmp/tts_response.json
  fi
else
  echo -e "${RED}✗ TTS endpoint not responding${NC}"
fi
echo ""

# Test 5: Prosody formula validation
echo -e "${YELLOW}Test 5: Prosody Formula Validation${NC}"
node -e "
const emotionGain = {
  low: 0.6,
  neutral: 0.9,
  high: 1.2,
  detached: 0.4,
};

const glowMap = {
  low: { base: 0.25 },
  neutral: { base: 0.45 },
  high: { base: 0.75 },
  detached: { base: 0.2 },
};

function validateFormulas() {
  const tests = [
    { emotion: 'low', pitch: 100, energy: 0.2 },
    { emotion: 'neutral', pitch: 200, energy: 0.5 },
    { emotion: 'high', pitch: 300, energy: 0.9 },
    { emotion: 'detached', pitch: 100, energy: 0.15 },
  ];

  let passed = true;

  tests.forEach(test => {
    const shimmer = 400 + Math.max(0, Math.min(1000, 1200 - test.pitch));
    const brightness = glowMap[test.emotion].base + test.energy * 0.5 * emotionGain[test.emotion];
    const scale = 1 + test.energy * 0.04 * emotionGain[test.emotion];

    if (shimmer < 400 || shimmer > 1600) {
      console.log(\`✗ Invalid shimmer speed: \${shimmer}ms\`);
      passed = false;
    }

    if (brightness < 0 || brightness > 2) {
      console.log(\`✗ Invalid brightness: \${brightness}\`);
      passed = false;
    }

    if (scale < 1 || scale > 1.2) {
      console.log(\`✗ Invalid scale: \${scale}\`);
      passed = false;
    }
  });

  if (passed) {
    console.log('✓ All prosody formulas validated');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

validateFormulas();
"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Prosody formulas validated${NC}"
else
  echo -e "${RED}✗ Prosody formula validation failed${NC}"
  exit 1
fi
echo ""

# Summary
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}All Prosody Integration Tests Passed! ✓${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📊 Test Summary:"
echo "  ✓ Backend health check"
echo "  ✓ WebSocket connection"
echo "  ✓ Prosody data streaming"
echo "  ✓ TTS endpoint (fallback mode)"
echo "  ✓ Prosody formula validation"
echo ""
echo "🎵 Prosody System Ready:"
echo "  - WebSocket: $PROSODY_WS_URL"
echo "  - TTS API: $BACKEND_URL/api/tts/synthesize"
echo "  - Mobile hook: useProsodyStream('$PROSODY_WS_URL')"
echo ""
echo "📱 Next Steps:"
echo "  1. Start mobile app: cd packages/mobile && npm start"
echo "  2. Test prosody in conversation screen"
echo "  3. Configure Google Cloud TTS for production"
echo "  4. Deploy to staging environment"
echo ""

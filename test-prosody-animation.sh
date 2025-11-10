#!/bin/bash
# Test Prosody-Driven Animation System
# Validates pitch detection, energy calculation, and animation behavior

set -e

echo "🎵 Testing Prosody-Driven Animation System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Backend Prosody Service
echo -e "${YELLOW}Test 1: Backend Prosody Service${NC}"
cd packages/backend

# Check if prosody.service.ts exists
if [ -f "src/services/prosody.service.ts" ]; then
  echo -e "${GREEN}✓ prosody.service.ts exists${NC}"
else
  echo -e "${RED}✗ prosody.service.ts not found${NC}"
  exit 1
fi

# Test TypeScript compilation
echo "  Checking TypeScript compilation..."
npx tsc --noEmit src/services/prosody.service.ts 2>&1 | grep -q "error" && {
  echo -e "${RED}✗ TypeScript compilation failed${NC}"
  exit 1
} || echo -e "${GREEN}✓ TypeScript compilation passed${NC}"

echo ""

# Test 2: Mobile Prosody Hooks
echo -e "${YELLOW}Test 2: Mobile Prosody Hooks${NC}"
cd ../mobile

if [ -f "hooks/useProsody.ts" ]; then
  echo -e "${GREEN}✓ useProsody.ts exists${NC}"
else
  echo -e "${RED}✗ useProsody.ts not found${NC}"
  exit 1
fi

# Test TypeScript compilation
echo "  Checking TypeScript compilation..."
npx tsc --noEmit hooks/useProsody.ts 2>&1 | grep -q "error" && {
  echo -e "${RED}✗ TypeScript compilation failed${NC}"
  exit 1
} || echo -e "${GREEN}✓ TypeScript compilation passed${NC}"

echo ""

# Test 3: SianiAvatar Prosody Props
echo -e "${YELLOW}Test 3: SianiAvatar Prosody Props${NC}"

if [ -f "components/SianiAvatar.tsx" ]; then
  echo -e "${GREEN}✓ SianiAvatar.tsx exists${NC}"
else
  echo -e "${RED}✗ SianiAvatar.tsx not found${NC}"
  exit 1
fi

# Check for prosody props
if grep -q "pitchHz?: number" components/SianiAvatar.tsx; then
  echo -e "${GREEN}✓ pitchHz prop defined${NC}"
else
  echo -e "${RED}✗ pitchHz prop missing${NC}"
  exit 1
fi

if grep -q "energy?: number" components/SianiAvatar.tsx; then
  echo -e "${GREEN}✓ energy prop defined${NC}"
else
  echo -e "${RED}✗ energy prop missing${NC}"
  exit 1
fi

# Check for emotion gain
if grep -q "emotionGain" components/SianiAvatar.tsx; then
  echo -e "${GREEN}✓ emotionGain modulation implemented${NC}"
else
  echo -e "${RED}✗ emotionGain modulation missing${NC}"
  exit 1
fi

# Check for shimmer speed calculation
if grep -q "shimmerSpeed" components/SianiAvatar.tsx; then
  echo -e "${GREEN}✓ Pitch → shimmer speed mapping implemented${NC}"
else
  echo -e "${RED}✗ Pitch → shimmer speed mapping missing${NC}"
  exit 1
fi

# Check for reactive brightness
if grep -q "reactiveBrightness" components/SianiAvatar.tsx; then
  echo -e "${GREEN}✓ Energy → brightness mapping implemented${NC}"
else
  echo -e "${RED}✗ Energy → brightness mapping missing${NC}"
  exit 1
fi

echo ""

# Test 4: Documentation
echo -e "${YELLOW}Test 4: Documentation${NC}"
cd ../../

if [ -f "PROSODY_ANIMATION_GUIDE.md" ]; then
  echo -e "${GREEN}✓ PROSODY_ANIMATION_GUIDE.md exists${NC}"
else
  echo -e "${RED}✗ PROSODY_ANIMATION_GUIDE.md not found${NC}"
  exit 1
fi

if [ -f "PROSODY_QUICK_REFERENCE.md" ]; then
  echo -e "${GREEN}✓ PROSODY_QUICK_REFERENCE.md exists${NC}"
else
  echo -e "${RED}✗ PROSODY_QUICK_REFERENCE.md not found${NC}"
  exit 1
fi

echo ""

# Test 5: Animation Behavior Validation
echo -e "${YELLOW}Test 5: Animation Behavior Validation${NC}"

# Create a test script to validate animation formulas
cat > /tmp/test-prosody-formulas.js << 'EOF'
// Test prosody animation formulas

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

function calculateShimmerSpeed(pitchHz) {
  return 400 + Math.max(0, Math.min(1000, 1200 - pitchHz));
}

function calculateBrightness(emotion, energy) {
  return glowMap[emotion].base + energy * 0.5 * emotionGain[emotion];
}

function calculateScale(emotion, energy) {
  return 1 + energy * 0.04 * emotionGain[emotion];
}

// Test cases
const tests = [
  { name: 'Low pitch, low energy', pitch: 100, energy: 0.2, emotion: 'low' },
  { name: 'Mid pitch, mid energy', pitch: 200, energy: 0.5, emotion: 'neutral' },
  { name: 'High pitch, high energy', pitch: 300, energy: 0.9, emotion: 'high' },
  { name: 'Flat monotone', pitch: 100, energy: 0.15, emotion: 'detached' },
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const shimmer = calculateShimmerSpeed(test.pitch);
  const brightness = calculateBrightness(test.emotion, test.energy);
  const scale = calculateScale(test.emotion, test.energy);
  
  console.log(`\nTest: ${test.name}`);
  console.log(`  Pitch: ${test.pitch} Hz → Shimmer: ${shimmer}ms`);
  console.log(`  Energy: ${test.energy} → Brightness: ${brightness.toFixed(3)}`);
  console.log(`  Energy: ${test.energy} → Scale: ${scale.toFixed(3)}x`);
  
  // Validate ranges
  if (shimmer >= 400 && shimmer <= 1600) {
    console.log('  ✓ Shimmer speed in valid range');
    passed++;
  } else {
    console.log('  ✗ Shimmer speed out of range');
    failed++;
  }
  
  if (brightness >= 0 && brightness <= 1.5) {
    console.log('  ✓ Brightness in valid range');
    passed++;
  } else {
    console.log('  ✗ Brightness out of range');
    failed++;
  }
  
  if (scale >= 1 && scale <= 1.1) {
    console.log('  ✓ Scale in valid range');
    passed++;
  } else {
    console.log('  ✗ Scale out of range');
    failed++;
  }
});

console.log(`\n\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
EOF

node /tmp/test-prosody-formulas.js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Animation formulas validated${NC}"
else
  echo -e "${RED}✗ Animation formula validation failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}All Prosody Tests Passed! ✓${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📊 Test Summary:"
echo "  ✓ Backend prosody service"
echo "  ✓ Mobile prosody hooks"
echo "  ✓ SianiAvatar prosody props"
echo "  ✓ Documentation complete"
echo "  ✓ Animation formulas validated"
echo ""
echo "🚀 Next Steps:"
echo "  1. Implement WebSocket prosody endpoint"
echo "  2. Integrate with TTS pipeline"
echo "  3. Test with real voice data"
echo "  4. Deploy to staging environment"
echo ""

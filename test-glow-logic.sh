#!/bin/bash

# Test Enhanced Emotion Avatar Implementation
# Tests glow logic, micro-animations, and haptic feedback

# Change to project root
cd "$(dirname "$0")"

echo "🧪 Testing Enhanced Emotion Avatar Implementation"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((TESTS_PASSED++))
}

fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((TESTS_FAILED++))
}

info() {
  echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

# Test 1: Check glowLogic.ts exists
echo "Test 1: Verify glowLogic.ts exists"
if [ -f "packages/mobile/utils/glowLogic.ts" ]; then
  pass "glowLogic.ts file exists"
else
  fail "glowLogic.ts file not found"
fi
echo ""

# Test 2: Check EmotionAvatarEnhanced.tsx exists
echo "Test 2: Verify EmotionAvatarEnhanced.tsx exists"
if [ -f "packages/mobile/components/EmotionAvatarEnhanced.tsx" ]; then
  pass "EmotionAvatarEnhanced.tsx file exists"
else
  fail "EmotionAvatarEnhanced.tsx file not found"
fi
echo ""

# Test 3: Check GLOW_MAP configuration
echo "Test 3: Verify GLOW_MAP configuration"
if grep -q "export const GLOW_MAP" packages/mobile/utils/glowLogic.ts; then
  if grep -q "calm:" packages/mobile/utils/glowLogic.ts && \
     grep -q "anxious:" packages/mobile/utils/glowLogic.ts && \
     grep -q "motivated:" packages/mobile/utils/glowLogic.ts && \
     grep -q "neutral:" packages/mobile/utils/glowLogic.ts; then
    pass "GLOW_MAP has all 4 emotion states"
  else
    fail "GLOW_MAP missing emotion states"
  fi
else
  fail "GLOW_MAP not exported"
fi
echo ""

# Test 4: Check AVATAR_STATE_MAP configuration
echo "Test 4: Verify AVATAR_STATE_MAP configuration"
if grep -q "export const AVATAR_STATE_MAP" packages/mobile/utils/glowLogic.ts; then
  if grep -q "idle:" packages/mobile/utils/glowLogic.ts && \
     grep -q "listening:" packages/mobile/utils/glowLogic.ts && \
     grep -q "processing:" packages/mobile/utils/glowLogic.ts && \
     grep -q "thinking:" packages/mobile/utils/glowLogic.ts && \
     grep -q "responding:" packages/mobile/utils/glowLogic.ts; then
    pass "AVATAR_STATE_MAP has all 5 states"
  else
    fail "AVATAR_STATE_MAP missing states"
  fi
else
  fail "AVATAR_STATE_MAP not exported"
fi
echo ""

# Test 5: Check sine-wave calculation function
echo "Test 5: Verify sine-wave opacity calculation"
if grep -q "export function calculateGlowOpacity" packages/mobile/utils/glowLogic.ts; then
  if grep -q "Math.sin" packages/mobile/utils/glowLogic.ts; then
    pass "calculateGlowOpacity uses sine wave"
  else
    fail "calculateGlowOpacity missing sine calculation"
  fi
else
  fail "calculateGlowOpacity function not found"
fi
echo ""

# Test 6: Check HapticEventBus class
echo "Test 6: Verify HapticEventBus implementation"
if grep -q "export class HapticEventBus" packages/mobile/utils/glowLogic.ts; then
  if grep -q "subscribe" packages/mobile/utils/glowLogic.ts && \
     grep -q "unsubscribe" packages/mobile/utils/glowLogic.ts && \
     grep -q "emit" packages/mobile/utils/glowLogic.ts; then
    pass "HapticEventBus has required methods"
  else
    fail "HapticEventBus missing methods"
  fi
else
  fail "HapticEventBus class not found"
fi
echo ""

# Test 7: Check micro-animation configurations
echo "Test 7: Verify MICRO_ANIMATION_CONFIG"
if grep -q "export const MICRO_ANIMATION_CONFIG" packages/mobile/utils/glowLogic.ts; then
  if grep -q "breathe:" packages/mobile/utils/glowLogic.ts && \
     grep -q "lean:" packages/mobile/utils/glowLogic.ts && \
     grep -q "flicker:" packages/mobile/utils/glowLogic.ts && \
     grep -q "tighten:" packages/mobile/utils/glowLogic.ts; then
    pass "MICRO_ANIMATION_CONFIG has all 4 animation types"
  else
    fail "MICRO_ANIMATION_CONFIG missing animation types"
  fi
else
  fail "MICRO_ANIMATION_CONFIG not exported"
fi
echo ""

# Test 8: Check pre-response delay constant
echo "Test 8: Verify PRE_RESPONSE_DELAY_MS constant"
if grep -q "export const PRE_RESPONSE_DELAY_MS" packages/mobile/utils/glowLogic.ts; then
  pass "PRE_RESPONSE_DELAY_MS constant exists"
else
  fail "PRE_RESPONSE_DELAY_MS not found"
fi
echo ""

# Test 9: Check EnhancedAvatar animation refs
echo "Test 9: Verify animation refs in EmotionAvatarEnhanced"
if grep -q "breatheAnim" packages/mobile/components/EmotionAvatarEnhanced.tsx && \
   grep -q "leanAnim" packages/mobile/components/EmotionAvatarEnhanced.tsx && \
   grep -q "flickerAnim" packages/mobile/components/EmotionAvatarEnhanced.tsx && \
   grep -q "tightenAnim" packages/mobile/components/EmotionAvatarEnhanced.tsx; then
  pass "All micro-animation refs defined"
else
  fail "Missing micro-animation refs"
fi
echo ""

# Test 10: Check state machine implementation
echo "Test 10: Verify avatar state machine"
if grep -q "const \[avatarState, setAvatarState\]" packages/mobile/components/EmotionAvatarEnhanced.tsx; then
  if grep -q "AvatarState" packages/mobile/components/EmotionAvatarEnhanced.tsx; then
    pass "Avatar state machine implemented"
  else
    fail "AvatarState type not used"
  fi
else
  fail "Avatar state machine not found"
fi
echo ""

# Test 11: Check haptic feedback patterns
echo "Test 11: Verify haptic feedback patterns"
if grep -q "Haptics.notificationAsync" packages/mobile/components/EmotionAvatarEnhanced.tsx && \
   grep -q "Haptics.impactAsync" packages/mobile/components/EmotionAvatarEnhanced.tsx && \
   grep -q "Haptics.selectionAsync" packages/mobile/components/EmotionAvatarEnhanced.tsx; then
  pass "All haptic feedback types implemented"
else
  fail "Missing haptic feedback patterns"
fi
echo ""

# Test 12: Check wearable sync prop
echo "Test 12: Verify wearable sync integration"
if grep -q "enableWearableSync" packages/mobile/components/EmotionAvatarEnhanced.tsx; then
  if grep -q "hapticEventBus" packages/mobile/components/EmotionAvatarEnhanced.tsx; then
    pass "Wearable sync integration present"
  else
    fail "hapticEventBus not used"
  fi
else
  fail "enableWearableSync prop not found"
fi
echo ""

# Test 13: Check TypeScript compilation
echo "Test 13: TypeScript compilation check"
cd packages/mobile
if npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error TS"; then
  fail "TypeScript compilation errors found"
  cd ../..
else
  pass "TypeScript compiles without errors"
  cd ../..
fi
echo ""

# Test 14: Check documentation exists
echo "Test 14: Verify documentation files"
DOC_PASSED=0
if [ -f "GLOW_LOGIC_IMPLEMENTATION.md" ]; then
  ((DOC_PASSED++))
fi
if [ -f "GLOW_LOGIC_QUICK_REFERENCE.md" ]; then
  ((DOC_PASSED++))
fi

if [ $DOC_PASSED -eq 2 ]; then
  pass "All documentation files exist"
else
  fail "Missing documentation files ($DOC_PASSED/2 found)"
fi
echo ""

# Test 15: Check original avatar preserved
echo "Test 15: Verify backward compatibility"
if [ -f "packages/mobile/components/EmotionAvatar.tsx" ]; then
  pass "Original EmotionAvatar.tsx preserved"
else
  fail "Original EmotionAvatar.tsx not found"
fi
echo ""

# Summary
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "📱 Next Steps:"
  echo "1. Run 'npm start' in packages/mobile to test on device"
  echo "2. Test avatar state transitions with voice interaction"
  echo "3. Verify haptic feedback on physical device"
  echo "4. Check glow colors match emotions"
  echo "5. Review GLOW_LOGIC_QUICK_REFERENCE.md for usage"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  echo ""
  echo "Please review the failed tests above and check:"
  echo "- All files were created correctly"
  echo "- TypeScript compiles without errors"
  echo "- All required constants and functions are exported"
  exit 1
fi

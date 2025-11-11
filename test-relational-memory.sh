#!/bin/bash
# Test Relational Memory System

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
USER_ID="test-user-relational-$(date +%s)"

echo "🧪 Testing Relational Memory System"
echo "===================================="
echo "User ID: $USER_ID"
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Store first conversation (anxious about work)
echo -e "${BLUE}Test 1: Store first conversation (anxious about work)${NC}"
curl -s -X POST "$BASE_URL/api/memory/relational/store" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"transcript\": \"I've been feeling really stressed about my job lately. The deadlines are overwhelming.\",
    \"emotion\": \"anxious\",
    \"emotionVector\": [0.2, 0.7, 0.1],
    \"topics\": [\"work\", \"stress\", \"deadlines\"]
  }" | jq '.'
echo ""
sleep 1

# Test 2: Store second conversation (still anxious, different topic)
echo -e "${BLUE}Test 2: Store second conversation (housing concerns)${NC}"
curl -s -X POST "$BASE_URL/api/memory/relational/store" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"transcript\": \"I'm worried about finding stable housing. My lease is ending soon.\",
    \"emotion\": \"anxious\",
    \"emotionVector\": [0.3, 0.6, 0.1],
    \"topics\": [\"housing\", \"stress\", \"stability\"]
  }" | jq '.'
echo ""
sleep 1

# Test 3: Store third conversation (calm reflection)
echo -e "${BLUE}Test 3: Store third conversation (calm reflection on work)${NC}"
curl -s -X POST "$BASE_URL/api/memory/relational/store" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"transcript\": \"I talked to my manager today and we worked out a better timeline. I feel much calmer now.\",
    \"emotion\": \"calm\",
    \"emotionVector\": [0.7, 0.2, 0.1],
    \"topics\": [\"work\", \"resolution\", \"calm\"]
  }" | jq '.'
echo ""
sleep 1

# Test 4: Store fourth conversation (lit - excited about new opportunity)
echo -e "${BLUE}Test 4: Store fourth conversation (excited about new opportunity)${NC}"
curl -s -X POST "$BASE_URL/api/memory/relational/store" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"transcript\": \"I just got offered a new position! I'm so excited and energized about this!\",
    \"emotion\": \"lit\",
    \"emotionVector\": [0.2, 0.1, 0.7],
    \"topics\": [\"work\", \"opportunity\", \"excitement\"]
  }" | jq '.'
echo ""
sleep 1

# Test 5: Retrieve context (similar to Test 1 - anxious about work)
echo -e "${BLUE}Test 5: Retrieve context for anxious work conversation${NC}"
TRANSCRIPT="I'm feeling stressed about work again"
EMOTION="anxious"
EMOTION_VECTOR="[0.25,0.65,0.1]"
curl -s "$BASE_URL/api/memory/relational/context/$USER_ID?transcript=$(echo $TRANSCRIPT | jq -sRr @uri)&emotion=$EMOTION&emotionVector=$(echo $EMOTION_VECTOR | jq -sRr @uri)&limit=5" | jq '.'
echo ""
sleep 1

# Test 6: Retrieve context (similar to Test 4 - excited/lit)
echo -e "${BLUE}Test 6: Retrieve context for excited/lit conversation${NC}"
TRANSCRIPT="I'm so pumped about this new thing"
EMOTION="lit"
EMOTION_VECTOR="[0.15,0.15,0.7]"
curl -s "$BASE_URL/api/memory/relational/context/$USER_ID?transcript=$(echo $TRANSCRIPT | jq -sRr @uri)&emotion=$EMOTION&emotionVector=$(echo $EMOTION_VECTOR | jq -sRr @uri)&limit=5" | jq '.'
echo ""
sleep 1

# Test 7: Get relational metrics
echo -e "${BLUE}Test 7: Get relational metrics${NC}"
curl -s "$BASE_URL/api/memory/relational/metrics/$USER_ID" | jq '.'
echo ""

# Test 8: Retrieve context with no emotional similarity
echo -e "${BLUE}Test 8: Retrieve context with opposite emotion (should have low matches)${NC}"
TRANSCRIPT="Everything is neutral and fine"
EMOTION="neutral"
EMOTION_VECTOR="[0.33,0.34,0.33]"
curl -s "$BASE_URL/api/memory/relational/context/$USER_ID?transcript=$(echo $TRANSCRIPT | jq -sRr @uri)&emotion=$EMOTION&emotionVector=$(echo $EMOTION_VECTOR | jq -sRr @uri)&limit=5" | jq '.'
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "- Stored 4 conversations with different emotions (anxious, calm, lit)"
echo "- Retrieved contextually similar memories based on emotional similarity"
echo "- Retrieved relational metrics (Trust, Resonance, Continuity)"
echo "- Tested edge case with neutral emotion (low similarity)"
echo ""
echo -e "${YELLOW}Expected Results:${NC}"
echo "- Test 5 should retrieve Test 1 & 2 (high anxious similarity)"
echo "- Test 6 should retrieve Test 4 (high lit similarity)"
echo "- Test 7 should show evolving trust/resonance metrics"
echo "- Test 8 should have fewer or no matches (neutral has low similarity to specific emotions)"

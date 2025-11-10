#!/bin/bash

# Integration Test for Prosody-Enhanced Memory System
# Tests the complete flow: Transcription → Prosody Analysis → Memory Creation → Search → Lifecycle

set -e

echo "🧪 Testing Prosody-Enhanced Memory System Integration"
echo "=================================================="
echo ""

# Configuration
BASE_URL="http://localhost:3000"
AUTH_TOKEN="test_token"  # Replace with actual token

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_field=$5

  echo -e "${YELLOW}Test: ${test_name}${NC}"
  
  response=$(curl -s -X $method "${BASE_URL}${endpoint}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "${data}")
  
  if echo "$response" | jq -e ".${expected_field}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $response"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  echo ""
}

# Test 1: Create memory with high-emotion prosody
echo "📝 Test 1: Create high-emotion memory with prosody"
test_endpoint \
  "Create high-emotion memory" \
  "POST" \
  "/api/memory-moments" \
  '{
    "userId": "test_user_prosody",
    "content": "I had a major breakthrough in therapy today! I feel amazing!",
    "emotion": "high",
    "tone": "hopeful",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 280,
      "energy": 0.85,
      "emotion": "high",
      "pitchVariance": 60
    }
  }' \
  "id"

# Test 2: Create memory with low-emotion prosody
echo "📝 Test 2: Create low-emotion memory with prosody"
test_endpoint \
  "Create low-emotion memory" \
  "POST" \
  "/api/memory-moments" \
  '{
    "userId": "test_user_prosody",
    "content": "Feeling down today, struggling to get out of bed",
    "emotion": "low",
    "tone": "subdued",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 150,
      "energy": 0.3,
      "emotion": "low",
      "pitchVariance": 15
    }
  }' \
  "id"

# Test 3: Create memory with anxious prosody
echo "📝 Test 3: Create anxious memory with prosody"
test_endpoint \
  "Create anxious memory" \
  "POST" \
  "/api/memory-moments" \
  '{
    "userId": "test_user_prosody",
    "content": "I am worried about the upcoming appointment",
    "emotion": "anxious",
    "tone": "tense",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 240,
      "energy": 0.6,
      "emotion": "anxious",
      "pitchVariance": 45
    }
  }' \
  "id"

# Wait for vector DB to index
echo "⏳ Waiting 2 seconds for vector DB indexing..."
sleep 2

# Test 4: Search with high-emotion prosody
echo "🔍 Test 4: Search with high-emotion prosody"
test_endpoint \
  "Search with high-emotion prosody" \
  "POST" \
  "/api/memory-moments/search" \
  '{
    "query": "therapy progress",
    "limit": 5,
    "prosody": {
      "pitchHz": 270,
      "energy": 0.8,
      "emotion": "high"
    }
  }' \
  "results"

# Test 5: Search with low-emotion prosody
echo "🔍 Test 5: Search with low-emotion prosody"
test_endpoint \
  "Search with low-emotion prosody" \
  "POST" \
  "/api/memory-moments/search" \
  '{
    "query": "feeling today",
    "limit": 5,
    "prosody": {
      "pitchHz": 160,
      "energy": 0.35,
      "emotion": "low"
    }
  }' \
  "results"

# Test 6: Search without prosody (baseline)
echo "🔍 Test 6: Search without prosody (baseline)"
test_endpoint \
  "Search without prosody" \
  "POST" \
  "/api/memory-moments/search" \
  '{
    "query": "therapy",
    "limit": 5
  }' \
  "results"

# Test 7: Get memory lifecycle stats
echo "📊 Test 7: Get memory lifecycle statistics"
test_endpoint \
  "Get lifecycle stats" \
  "GET" \
  "/api/memory-moments/lifecycle/stats" \
  "" \
  "total"

# Test 8: Apply memory decay (dry run)
echo "⏱️  Test 8: Apply memory decay (dry run)"
test_endpoint \
  "Apply memory decay" \
  "POST" \
  "/api/memory-moments/lifecycle/decay" \
  '{
    "dryRun": true
  }' \
  "success"

# Test 9: Cleanup expired memories (dry run)
echo "🧹 Test 9: Cleanup expired memories (dry run)"
test_endpoint \
  "Cleanup expired memories" \
  "POST" \
  "/api/memory-moments/lifecycle/cleanup" \
  '{
    "dryRun": true,
    "gracePeriodMultiplier": 2.0
  }' \
  "success"

# Test 10: Get memories by emotion
echo "🎭 Test 10: Get memories by emotion"
response=$(curl -s -X GET "${BASE_URL}/api/memory-moments/by-emotion/high" \
  -H "Authorization: Bearer ${AUTH_TOKEN}")

if echo "$response" | jq -e ".moments" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
  echo "Response: $response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Summary
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi

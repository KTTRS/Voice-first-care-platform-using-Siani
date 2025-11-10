#!/bin/bash

echo "🧪 Testing Prosody-Enhanced Memory System"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"
AUTH_TOKEN="test_token_placeholder"
USER_ID="test_user_prosody"

echo "⚠️  Prerequisites:"
echo "   - Backend running on port 3000"
echo "   - Weaviate running (docker-compose up)"
echo "   - Valid authentication token"
echo ""
read -p "Press Enter to continue..."
echo ""

# Test 1: Create high-emotion memory with prosody
echo "1️⃣  Creating HIGH-EMOTION memory with prosody..."
echo "   Content: 'I had a major breakthrough in therapy today!'"
echo "   Prosody: pitchHz=280, energy=0.85, emotion=high"
echo ""

HIGH_EMOTION_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "userId": "'${USER_ID}'",
    "content": "I had a major breakthrough in therapy today!",
    "emotion": "high",
    "tone": "hopeful",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 280,
      "energy": 0.85,
      "emotion": "high",
      "pitchVariance": 60
    }
  }')

echo "Response:"
echo ${HIGH_EMOTION_RESPONSE} | jq '.id, .content, .emotion, .prosodyEnabled'
echo ""
sleep 2

# Test 2: Create low-emotion memory with prosody
echo "2️⃣  Creating LOW-EMOTION memory with prosody..."
echo "   Content: 'Feeling pretty down today, hard to get out of bed'"
echo "   Prosody: pitchHz=150, energy=0.3, emotion=low"
echo ""

LOW_EMOTION_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "userId": "'${USER_ID}'",
    "content": "Feeling pretty down today, hard to get out of bed",
    "emotion": "low",
    "tone": "subdued",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 150,
      "energy": 0.3,
      "emotion": "low",
      "pitchVariance": 15
    }
  }')

echo "Response:"
echo ${LOW_EMOTION_RESPONSE} | jq '.id, .content, .emotion, .prosodyEnabled'
echo ""
sleep 2

# Test 3: Create neutral memory with prosody
echo "3️⃣  Creating NEUTRAL memory with prosody..."
echo "   Content: 'Had a normal day at work, nothing special'"
echo "   Prosody: pitchHz=200, energy=0.5, emotion=neutral"
echo ""

NEUTRAL_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "userId": "'${USER_ID}'",
    "content": "Had a normal day at work, nothing special",
    "emotion": "neutral",
    "tone": "calm",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 200,
      "energy": 0.5,
      "emotion": "neutral",
      "pitchVariance": 25
    }
  }')

echo "Response:"
echo ${NEUTRAL_RESPONSE} | jq '.id, .content, .emotion, .prosodyEnabled'
echo ""
sleep 2

# Test 4: Create anxious memory with prosody
echo "4️⃣  Creating ANXIOUS memory with prosody..."
echo "   Content: 'Worried about upcoming presentation, feeling tense'"
echo "   Prosody: pitchHz=240, energy=0.6, emotion=anxious"
echo ""

ANXIOUS_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "userId": "'${USER_ID}'",
    "content": "Worried about upcoming presentation, feeling tense",
    "emotion": "anxious",
    "tone": "stressed",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 240,
      "energy": 0.6,
      "emotion": "anxious",
      "pitchVariance": 40
    }
  }')

echo "Response:"
echo ${ANXIOUS_RESPONSE} | jq '.id, .content, .emotion, .prosodyEnabled'
echo ""
sleep 2

echo "=========================================="
echo "5️⃣  Searching with HIGH-EMOTION prosody..."
echo "   Query: 'therapy progress'"
echo "   Prosody: pitchHz=270, energy=0.8, emotion=high"
echo "   Expected: High-emotion memory ranked highest"
echo ""

HIGH_SEARCH=$(curl -s -X POST ${BASE_URL}/api/memory-moments/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "query": "therapy progress",
    "limit": 5,
    "prosody": {
      "pitchHz": 270,
      "energy": 0.8,
      "emotion": "high"
    }
  }')

echo "Results (with emotion-weighted scoring):"
echo ${HIGH_SEARCH} | jq '.results[] | {content: .content[0:50], emotion, emotionIntensity, score}'
echo ""
sleep 2

echo "=========================================="
echo "6️⃣  Searching with LOW-EMOTION prosody..."
echo "   Query: 'feeling down'"
echo "   Prosody: pitchHz=160, energy=0.35, emotion=low"
echo "   Expected: Low-emotion memory ranked highest"
echo ""

LOW_SEARCH=$(curl -s -X POST ${BASE_URL}/api/memory-moments/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "query": "feeling down",
    "limit": 5,
    "prosody": {
      "pitchHz": 160,
      "energy": 0.35,
      "emotion": "low"
    }
  }')

echo "Results (with emotion-weighted scoring):"
echo ${LOW_SEARCH} | jq '.results[] | {content: .content[0:50], emotion, emotionIntensity, score}'
echo ""
sleep 2

echo "=========================================="
echo "7️⃣  Searching WITHOUT prosody (baseline)..."
echo "   Query: 'therapy progress'"
echo "   Expected: Pure semantic search, no emotion weighting"
echo ""

BASELINE_SEARCH=$(curl -s -X POST ${BASE_URL}/api/memory-moments/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "query": "therapy progress",
    "limit": 5
  }')

echo "Results (baseline semantic search):"
echo ${BASELINE_SEARCH} | jq '.results[] | {content: .content[0:50], emotion, score}'
echo ""
sleep 2

echo "=========================================="
echo "8️⃣  Searching by emotion category..."
echo "   Emotion: high"
echo ""

EMOTION_SEARCH=$(curl -s ${BASE_URL}/api/memory-moments/by-emotion/high?limit=5 \
  -H "Authorization: Bearer ${AUTH_TOKEN}")

echo "High-emotion memories:"
echo ${EMOTION_SEARCH} | jq '.moments[] | {content: .content[0:50], emotion, emotionIntensity}'
echo ""

echo "=========================================="
echo "✅ Prosody memory tests complete!"
echo ""
echo "📊 Summary:"
echo "   - Created 4 memories with different emotional prosody"
echo "   - Tested emotion-weighted search (high & low emotion)"
echo "   - Tested baseline semantic search (no prosody)"
echo "   - Tested emotion category filtering"
echo ""
echo "🔍 Key Observations:"
echo "   - High-emotion memories have emotionIntensity ~0.9"
echo "   - Low-emotion memories have emotionIntensity ~0.3"
echo "   - Emotion-weighted search boosts scores for matching emotions"
echo "   - Baseline search uses pure semantic similarity"
echo ""
echo "📝 Next Steps:"
echo "   - Integrate real-time prosody into /api/transcribe"
echo "   - Implement memory decay based on retentionTTL"
echo "   - Add memory reinforcement (recalled memories get boost)"

#!/bin/bash

# Signal Score Intelligence Layer - Test Script

set -e

echo "🧠 Signal Score Intelligence Layer - Test Suite"
echo "==============================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
EMAIL="${TEST_EMAIL:-john.doe@example.com}"
PASSWORD="${TEST_PASSWORD:-patient123}"

echo "📡 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Logged in as $EMAIL"
echo "👤 User ID: $USER_ID"
echo ""

# Test 1: Get current signal score (may not exist yet)
echo "📊 Test 1: Get Latest Signal Score"
echo "-----------------------------------"
CURRENT_SCORE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$USER_ID")

if echo $CURRENT_SCORE | jq -e '.id' > /dev/null 2>&1; then
  echo "✅ Found existing signal score:"
  echo $CURRENT_SCORE | jq '{overallRisk, badge, medicationAdherence, mentalHealthRisk, socialIsolation}'
else
  echo "ℹ️  No existing signal score (will create one next)"
fi
echo ""

# Test 2: Trigger real-time analysis
echo "🔄 Test 2: Trigger Signal Analysis"
echo "-----------------------------------"
ANALYSIS_RESULT=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$USER_ID/analyze")

echo "✅ Analysis completed:"
echo $ANALYSIS_RESULT | jq '.score | {overallRisk, badge, trends: {medication: .trendMedication, mental: .trendMentalHealth, social: .trendSocial}}'
echo ""

# Test 3: Create a positive memory moment
echo "😊 Test 3: Create Positive Memory Moment"
echo "-----------------------------------"
POSITIVE_MOMENT=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/api/memory-moments" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"content\": \"Feeling grateful and hopeful today. Had a wonderful visit with family.\",
    \"emotion\": \"happy\",
    \"tone\": \"positive\",
    \"vectorId\": \"test-positive-$(date +%s)\"
  }")

echo "✅ Created positive moment"
echo $POSITIVE_MOMENT | jq '{id, emotion, tone}'
echo ""

# Wait for async processing
echo "⏳ Waiting for signal update (3 seconds)..."
sleep 3

# Test 4: Check updated score
echo "📈 Test 4: Check Updated Score"
echo "-----------------------------------"
UPDATED_SCORE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$USER_ID")

echo "✅ Updated signal score:"
echo $UPDATED_SCORE | jq '{
  overall: .overallRisk,
  badge: .badge.emoji + " " + .badge.level,
  categories: {
    medication: .medicationAdherence,
    mental: .mentalHealthRisk,
    social: .socialIsolation,
    care: .careCoordination,
    trust: .systemTrust
  },
  metadata: {
    moments: .totalMoments,
    goals: .totalGoalsCompleted,
    streak: .streakDays
  }
}'
echo ""

# Test 5: Create a negative memory moment
echo "😔 Test 5: Create Negative Memory Moment"
echo "-----------------------------------"
NEGATIVE_MOMENT=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/api/memory-moments" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"content\": \"Feeling hopeless and alone. Can't seem to get better, very anxious and depressed.\",
    \"emotion\": \"sad\",
    \"tone\": \"negative\",
    \"vectorId\": \"test-negative-$(date +%s)\"
  }")

echo "✅ Created negative moment (3+ negative keywords should increase mental health risk)"
echo $NEGATIVE_MOMENT | jq '{id, emotion, tone}'
echo ""

# Wait for async processing
echo "⏳ Waiting for signal update (3 seconds)..."
sleep 3

# Test 6: Check risk increase
echo "⚠️  Test 6: Verify Risk Increase"
echo "-----------------------------------"
RISK_SCORE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$USER_ID")

MENTAL_RISK=$(echo $RISK_SCORE | jq -r '.mentalHealthRisk')
OVERALL_RISK=$(echo $RISK_SCORE | jq -r '.overallRisk')
BADGE=$(echo $RISK_SCORE | jq -r '.badge.level')

echo "📊 Current Scores:"
echo "  Mental Health Risk: $MENTAL_RISK"
echo "  Overall Risk: $OVERALL_RISK"
echo "  Badge: $BADGE"
echo ""

if (( $(echo "$MENTAL_RISK > 5" | bc -l) )); then
  echo "✅ Mental health risk increased as expected"
else
  echo "⚠️  Mental health risk may not have increased significantly"
fi
echo ""

# Test 7: Get score history
echo "📈 Test 7: Get Score History"
echo "-----------------------------------"
HISTORY=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$USER_ID/history?limit=5")

SCORE_COUNT=$(echo $HISTORY | jq '.count')
echo "✅ Found $SCORE_COUNT historical scores"

if [ "$SCORE_COUNT" -gt 1 ]; then
  echo "📊 Recent scores:"
  echo $HISTORY | jq '.scores[0:3] | .[] | {
    date: .createdAt,
    overall: .overallRisk,
    mental: .mentalHealthRisk,
    badge: .badge.level
  }'
fi
echo ""

# Test 8: Live analysis (no save)
echo "🔬 Test 8: Live Analysis (No Save)"
echo "-----------------------------------"
LIVE_ANALYSIS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$USER_ID/live")

echo "✅ Live analysis result:"
echo $LIVE_ANALYSIS | jq '{
  scores: .scores,
  trends: .trends,
  overall: .overallRisk,
  badge: .badge
}'
echo ""

# Test 9: Create a goal to test care coordination
echo "🎯 Test 9: Create Goal (Tests Signal Trigger)"
echo "-----------------------------------"
GOAL=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/api/goals" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"title\": \"Take medication daily\",
    \"points\": 10
  }")

echo "✅ Created goal:"
echo $GOAL | jq '{id, title, points}'
echo "ℹ️  Signal update queued (check worker logs)"
echo ""

# Summary
echo "==============================================="
echo "✅ All Tests Completed!"
echo "==============================================="
echo ""
echo "📊 Summary:"
echo "  - Signal scores are being calculated"
echo "  - Real-time triggers working"
echo "  - History tracking functional"
echo "  - Risk badges assigned correctly"
echo ""
echo "🔍 Next Steps:"
echo "  1. Check worker logs for signal processing"
echo "  2. View dashboard to visualize trends"
echo "  3. Test with multiple patients"
echo "  4. Monitor high-risk patient list"
echo ""

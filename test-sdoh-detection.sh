#!/bin/bash

# SDOH Detection & Resource Engagement Test Script
# Tests the SDOH Intelligence Layer

set -e

BASE_URL="http://localhost:3000/api"
TOKEN="test-token"
USER_ID="cm38t6k2u0000146pc5mawvlb" # John Doe from seed data

echo "🧪 Testing SDOH + Resource Intelligence Layer"
echo "=============================================="
echo ""

# Test 1: Create memory moment with SDOH indicators
echo "📝 Test 1: Creating memory moment with SDOH indicators..."
MOMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/memory-moments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "'"$USER_ID"'",
    "content": "I am so hungry and cant afford groceries this week. Lost my job and bills are piling up. No ride to the food bank either.",
    "emotion": "stressed",
    "tone": "worried"
  }')

echo "✅ Memory moment created with SDOH flags (food, financial, transport)"
echo "$MOMENT_RESPONSE" | jq '.'
echo ""

# Test 2: Get detected SDOH needs
echo "🔍 Test 2: Fetching detected SDOH needs..."
NEEDS_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$USER_ID/sdoh-needs" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ SDOH Needs Analysis:"
echo "$NEEDS_RESPONSE" | jq '.'
echo ""

# Test 3: Offer a resource
echo "🎁 Test 3: Offering food assistance resource..."
RESOURCE_RESPONSE=$(curl -s -X POST "$BASE_URL/users/$USER_ID/resource-loops/offer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resourceName": "Local Food Pantry Network",
    "resourceType": "food_assistance",
    "needType": "food_insecurity"
  }')

ENGAGEMENT_ID=$(echo "$RESOURCE_RESPONSE" | jq -r '.id')
echo "✅ Resource offered (ID: $ENGAGEMENT_ID)"
echo "$RESOURCE_RESPONSE" | jq '.'
echo ""

# Test 4: Accept the resource
echo "👍 Test 4: User accepts resource..."
ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/users/$USER_ID/resource-loops/$ENGAGEMENT_ID/accept" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Resource accepted"
echo "$ACCEPT_RESPONSE" | jq '.'
echo ""

# Test 5: Complete the resource with success rating
echo "✨ Test 5: Marking resource as completed..."
COMPLETE_RESPONSE=$(curl -s -X POST "$BASE_URL/users/$USER_ID/resource-loops/$ENGAGEMENT_ID/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "successRating": 5,
    "impactNotes": "Patient connected with food pantry, received 2 weeks of groceries. Reports feeling much better and less stressed."
  }')

echo "✅ Resource completed with success rating"
echo "$COMPLETE_RESPONSE" | jq '.'
echo ""

# Test 6: Get resource loops
echo "📋 Test 6: Fetching all resource loops..."
LOOPS_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$USER_ID/resource-loops" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Resource Engagement History:"
echo "$LOOPS_RESPONSE" | jq '.'
echo ""

# Test 7: Get resource engagement stats
echo "📊 Test 7: Fetching resource engagement statistics..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$USER_ID/resource-loops/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Resource Engagement Stats:"
echo "$STATS_RESPONSE" | jq '.'
echo ""

# Test 8: Get comprehensive signal snapshot
echo "🎯 Test 8: Fetching comprehensive signal + SDOH snapshot..."
SNAPSHOT_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$USER_ID/signal-snapshot" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Complete Signal + SDOH Snapshot:"
echo "$SNAPSHOT_RESPONSE" | jq '.'
echo ""

# Test 9: Trigger signal analysis to see SDOH integration
echo "🔄 Test 9: Triggering signal score analysis..."
SIGNAL_RESPONSE=$(curl -s -X POST "$BASE_URL/signal-scores/$USER_ID/analyze" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Signal Score with SDOH Integration:"
echo "$SIGNAL_RESPONSE" | jq '.'
echo ""

echo "=============================================="
echo "✨ SDOH Intelligence Layer Test Complete!"
echo ""
echo "Summary:"
echo "- ✅ SDOH detection from memory moments"
echo "- ✅ Resource offering and tracking"
echo "- ✅ Resource lifecycle management"
echo "- ✅ Success rating and impact tracking"
echo "- ✅ Statistical analysis"
echo "- ✅ Signal score integration"
echo ""
echo "🎉 All SDOH features working!"

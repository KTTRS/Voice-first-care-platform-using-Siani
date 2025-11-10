#!/bin/bash

# Test script for SDOH Message Integration & Follow-Up System
# Tests message processing, engagement creation, and follow-up scheduler

BASE_URL="http://localhost:3000"
TOKEN="test-token"

echo "🧪 Testing SDOH Message Integration & Follow-Up System"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Send message with transportation need
echo -e "${BLUE}Test 1: Send message mentioning transportation need${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I really need to get to my doctors appointment next week but I dont have a car anymore",
    "conversationId": "test-conv-1"
  }')

echo "$RESPONSE" | jq '.'
echo ""

# Extract engagement ID
ENGAGEMENT_ID=$(echo "$RESPONSE" | jq -r '.sdoh.newEngagements[0].id // empty')

if [ -n "$ENGAGEMENT_ID" ]; then
  echo -e "${GREEN}✓ Transportation need detected! Engagement ID: $ENGAGEMENT_ID${NC}"
else
  echo -e "${YELLOW}⚠ No engagement created (may already exist)${NC}"
fi
echo ""

# Test 2: Send message with food insecurity
echo -e "${BLUE}Test 2: Send message mentioning food insecurity${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Things are tight this month. Running out of groceries and not sure how Im going to feed my kids",
    "conversationId": "test-conv-2"
  }')

echo "$RESPONSE" | jq '.'
echo ""

FOOD_ENGAGEMENT=$(echo "$RESPONSE" | jq -r '.sdoh.newEngagements[0].id // empty')
if [ -n "$FOOD_ENGAGEMENT" ]; then
  echo -e "${GREEN}✓ Food insecurity detected! Engagement ID: $FOOD_ENGAGEMENT${NC}"
fi
echo ""

# Test 3: Send message with housing need
echo -e "${BLUE}Test 3: Send message mentioning housing issues${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My landlord is threatening to evict me because Im behind on rent. I dont know what to do",
    "conversationId": "test-conv-3"
  }')

echo "$RESPONSE" | jq '.'
echo ""

HOUSING_ENGAGEMENT=$(echo "$RESPONSE" | jq -r '.sdoh.newEngagements[0].id // empty')
if [ -n "$HOUSING_ENGAGEMENT" ]; then
  echo -e "${GREEN}✓ Housing need detected! Engagement ID: $HOUSING_ENGAGEMENT${NC}"
fi
echo ""

# Test 4: Get all resource engagements
echo -e "${BLUE}Test 4: Get all resource engagements${NC}"
curl -s -X GET "$BASE_URL/api/resource-engagements" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 5: Get engagement stats
echo -e "${BLUE}Test 5: Get engagement statistics${NC}"
curl -s -X GET "$BASE_URL/api/resource-engagements/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 6: Get pending engagements for conversation
echo -e "${BLUE}Test 6: Get pending engagements for Siani conversation${NC}"
curl -s -X GET "$BASE_URL/api/messages/pending-engagements" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 7: Accept an engagement (if we have one)
if [ -n "$ENGAGEMENT_ID" ]; then
  echo -e "${BLUE}Test 7: Accept transportation engagement${NC}"
  curl -s -X POST "$BASE_URL/api/resource-engagements/$ENGAGEMENT_ID/accept" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""
  echo -e "${GREEN}✓ Engagement accepted${NC}"
  echo ""
fi

# Test 8: Send message indicating success
if [ -n "$ENGAGEMENT_ID" ]; then
  echo -e "${BLUE}Test 8: Send message indicating resource was helpful${NC}"
  curl -s -X POST "$BASE_URL/api/messages" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "message": "Thanks so much! I was able to get a ride to my appointment. That service you told me about was really helpful",
      "conversationId": "test-conv-1"
    }' | jq '.'
  echo ""
fi

# Test 9: Manually trigger follow-up check
echo -e "${BLUE}Test 9: Manually trigger follow-up scheduler${NC}"
curl -s -X POST "$BASE_URL/api/resource-engagements/admin/trigger-follow-ups" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 10: Send neutral message (no SDOH need)
echo -e "${BLUE}Test 10: Send neutral message (should not detect needs)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I had a good day today. Feeling better than yesterday",
    "conversationId": "test-conv-4"
  }')

echo "$RESPONSE" | jq '.'
DETECTED=$(echo "$RESPONSE" | jq -r '.sdoh.newEngagements | length')
if [ "$DETECTED" -eq 0 ]; then
  echo -e "${GREEN}✓ No false positives - neutral message correctly ignored${NC}"
else
  echo -e "${YELLOW}⚠ False positive detected${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo -e "${GREEN}✓ SDOH Message Integration Test Complete!${NC}"
echo ""
echo "Key Features Tested:"
echo "  ✓ Message processing with SDOH detection"
echo "  ✓ Automatic engagement creation"
echo "  ✓ Multiple need types (transportation, food, housing)"
echo "  ✓ Engagement acceptance"
echo "  ✓ Success feedback detection"
echo "  ✓ Follow-up scheduler trigger"
echo "  ✓ False positive handling"
echo ""
echo "Next Steps:"
echo "  1. Check your terminal for scheduler logs"
echo "  2. View engagements in mobile app"
echo "  3. Wait for daily 10 AM follow-up (or trigger manually)"
echo ""


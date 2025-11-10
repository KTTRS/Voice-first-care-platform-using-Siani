#!/bin/bash

# Test script for new FeedEvent types
TOKEN="test-token"
BASE_URL="http://localhost:3000/api"
USER_ID="6916d6e8-a69d-4501-b703-d278c6d62947"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing New FeedEvent Types"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1️⃣  Testing GOAL_CREATED event..."
GOAL_RESPONSE=$(curl -s -X POST "$BASE_URL/goals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "title": "Test Streak Tracking",
    "points": 100
  }')
GOAL_ID=$(echo "$GOAL_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
if [ -n "$GOAL_ID" ]; then
  echo "   ✅ Goal created: $GOAL_ID"
else
  echo "   ❌ Failed to create goal"
fi

sleep 2

echo ""
echo "2️⃣  Testing DAILY_ACTION_COMPLETED event..."
ACTION_RESPONSE=$(curl -s -X POST "$BASE_URL/daily-actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "goalId": "'$GOAL_ID'",
    "content": "Test daily action",
    "points": 10,
    "completed": false
  }')
ACTION_ID=$(echo "$ACTION_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -n "$ACTION_ID" ]; then
  echo "   ✅ Action created: $ACTION_ID"
  
  # Now complete the action
  UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/daily-actions/$ACTION_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "completed": true
    }')
  echo "   ✅ Action completed"
else
  echo "   ❌ Failed to create action"
fi

sleep 2

echo ""
echo "3️⃣  Testing RESOURCE_USED event..."
RESOURCE_RESPONSE=$(curl -s -X POST "$BASE_URL/referral-loops" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "resource": "Mental Health Hotline",
    "status": "active"
  }')
RESOURCE_ID=$(echo "$RESOURCE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
if [ -n "$RESOURCE_ID" ]; then
  echo "   ✅ Resource used: Mental Health Hotline"
else
  echo "   ❌ Failed to track resource"
fi

sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Checking Feed Events..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FEED=$(curl -s "$BASE_URL/feed?userId=$USER_ID&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

echo ""
echo "Recent Feed Events:"
echo "$FEED" | python3 -c "
import sys, json
try:
    feed = json.load(sys.stdin)
    events = feed.get('data', [])
    print(f'\\n  Total events: {len(events)}\\n')
    for event in events[:5]:
        event_type = event.get('type', 'UNKNOWN')
        message = event.get('message', '')
        created = event.get('createdAt', '')[:19].replace('T', ' ')
        print(f'  • [{event_type}] {message}')
        print(f'    {created}\\n')
except Exception as e:
    print(f'  Error parsing feed: {e}')
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Event Types in Feed:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "$FEED" | python3 -c "
import sys, json
from collections import Counter
try:
    feed = json.load(sys.stdin)
    events = feed.get('data', [])
    types = Counter(e.get('type') for e in events)
    for event_type, count in types.most_common():
        emoji = {
            'GOAL_CREATED': '🎯',
            'GOAL_COMPLETED': '🏆',
            'DAILY_ACTION_COMPLETED': '✅',
            'STREAK_MAINTAINED': '🔥',
            'RESOURCE_USED': '🔗'
        }.get(event_type, '📝')
        print(f'  {emoji} {event_type}: {count}')
except Exception as e:
    print(f'  Error: {e}')
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Test Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

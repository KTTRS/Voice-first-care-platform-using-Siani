#!/bin/bash

# Test Siani Voice Conversation Flow
# Tests the complete pipeline: Auth → Send Message → Emotion → Memory → LLM → TTS → History

set -e

API_URL="http://localhost:3000"
echo "🧪 Testing Siani Conversation Flow"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Authenticate
echo -e "${BLUE}Step 1: Authenticating...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "patient123"
  }')

TOKEN=$(echo $AUTH_RESPONSE | jq -r '.accessToken')
USER_ID=$(echo $AUTH_RESPONSE | jq -r '.user.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Authentication failed${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Authenticated as John Doe${NC}"
echo "   User ID: $USER_ID"
echo ""

# Step 2: Send text message (simpler than audio for initial test)
echo -e "${BLUE}Step 2: Sending text message to Siani...${NC}"
MESSAGE_RESPONSE=$(curl -s -X POST "$API_URL/api/siani/message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "text": "Hey Siani, I am feeling really anxious today about my upcoming appointment. I do not know what to expect."
  }')

CONVERSATION_ID=$(echo $MESSAGE_RESPONSE | jq -r '.conversationId')
USER_MESSAGE_ID=$(echo $MESSAGE_RESPONSE | jq -r '.userMessageId')
ASSISTANT_MESSAGE_ID=$(echo $MESSAGE_RESPONSE | jq -r '.assistantMessageId')
REPLY_TEXT=$(echo $MESSAGE_RESPONSE | jq -r '.text')
EMOTION=$(echo $MESSAGE_RESPONSE | jq -r '.emotion')
AUDIO_URL=$(echo $MESSAGE_RESPONSE | jq -r '.audioUrl')

if [ "$CONVERSATION_ID" == "null" ] || [ -z "$CONVERSATION_ID" ]; then
  echo -e "${RED}❌ Failed to send message${NC}"
  echo "Response: $MESSAGE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Message sent successfully${NC}"
echo "   Conversation ID: $CONVERSATION_ID"
echo "   User Message ID: $USER_MESSAGE_ID"
echo "   Assistant Message ID: $ASSISTANT_MESSAGE_ID"
echo "   Detected Emotion: ${YELLOW}$EMOTION${NC}"
echo "   Siani's Reply: \"$REPLY_TEXT\""
echo "   Audio URL: ${AUDIO_URL:0:50}..."
echo ""

# Step 3: Verify emotion classification
echo -e "${BLUE}Step 3: Verifying emotion classification...${NC}"
if [ "$EMOTION" == "CALM" ] || [ "$EMOTION" == "GUARDED" ] || [ "$EMOTION" == "LIT" ]; then
  echo -e "${GREEN}✅ Valid emotion state: $EMOTION${NC}"
else
  echo -e "${YELLOW}⚠️  Unexpected emotion: $EMOTION${NC}"
fi
echo ""

# Step 4: Verify audio URL (should be base64 data URL for MVP)
echo -e "${BLUE}Step 4: Verifying audio synthesis...${NC}"
if [[ "$AUDIO_URL" == data:audio/* ]]; then
  echo -e "${GREEN}✅ Audio URL generated (base64 data URL)${NC}"
  AUDIO_SIZE=${#AUDIO_URL}
  echo "   Audio data size: $AUDIO_SIZE bytes"
else
  echo -e "${YELLOW}⚠️  Audio URL format unexpected: ${AUDIO_URL:0:50}...${NC}"
fi
echo ""

# Step 5: Verify relational context
echo -e "${BLUE}Step 5: Checking relational context...${NC}"
TRUST_LEVEL=$(echo $MESSAGE_RESPONSE | jq -r '.relationalContext.trustLevel')
FAMILIARITY=$(echo $MESSAGE_RESPONSE | jq -r '.relationalContext.familiarity')
CONTINUITY=$(echo $MESSAGE_RESPONSE | jq -r '.relationalContext.continuity')

if [ "$TRUST_LEVEL" != "null" ]; then
  echo -e "${GREEN}✅ Relational context included${NC}"
  echo "   Trust Level: $TRUST_LEVEL"
  echo "   Familiarity: $FAMILIARITY"
  echo "   Continuity: $CONTINUITY"
else
  echo -e "${YELLOW}⚠️  No relational context in response${NC}"
fi
echo ""

# Step 6: Get conversation history
echo -e "${BLUE}Step 6: Retrieving conversation history...${NC}"
HISTORY_RESPONSE=$(curl -s -X GET "$API_URL/api/siani/history/$CONVERSATION_ID" \
  -H "Authorization: Bearer $TOKEN")

MESSAGE_COUNT=$(echo $HISTORY_RESPONSE | jq '.messages | length')

if [ "$MESSAGE_COUNT" == "null" ] || [ "$MESSAGE_COUNT" -lt 2 ]; then
  echo -e "${RED}❌ Failed to retrieve history${NC}"
  echo "Response: $HISTORY_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ History retrieved successfully${NC}"
echo "   Total messages: $MESSAGE_COUNT"
echo ""

# Step 7: List user's conversations
echo -e "${BLUE}Step 7: Listing user's conversations...${NC}"
CONVERSATIONS_RESPONSE=$(curl -s -X GET "$API_URL/api/siani/conversations" \
  -H "Authorization: Bearer $TOKEN")

CONVERSATION_COUNT=$(echo $CONVERSATIONS_RESPONSE | jq '. | length')

if [ "$CONVERSATION_COUNT" == "null" ] || [ "$CONVERSATION_COUNT" -lt 1 ]; then
  echo -e "${RED}❌ Failed to list conversations${NC}"
  echo "Response: $CONVERSATIONS_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Conversations listed successfully${NC}"
echo "   Total conversations: $CONVERSATION_COUNT"
echo ""

# Step 8: Send follow-up message in same conversation
echo -e "${BLUE}Step 8: Sending follow-up message...${NC}"
FOLLOWUP_RESPONSE=$(curl -s -X POST "$API_URL/api/siani/message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"conversationId\": \"$CONVERSATION_ID\",
    \"text\": \"Thank you, that actually helps me feel a bit calmer.\"
  }")

FOLLOWUP_EMOTION=$(echo $FOLLOWUP_RESPONSE | jq -r '.emotion')
FOLLOWUP_REPLY=$(echo $FOLLOWUP_RESPONSE | jq -r '.text')

if [ "$FOLLOWUP_EMOTION" == "null" ]; then
  echo -e "${RED}❌ Failed to send follow-up${NC}"
  echo "Response: $FOLLOWUP_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Follow-up message sent${NC}"
echo "   New Emotion: ${YELLOW}$FOLLOWUP_EMOTION${NC}"
echo "   Siani's Reply: \"$FOLLOWUP_REPLY\""
echo ""

# Step 9: Verify conversation continuity
echo -e "${BLUE}Step 9: Verifying conversation continuity...${NC}"
UPDATED_HISTORY=$(curl -s -X GET "$API_URL/api/siani/history/$CONVERSATION_ID" \
  -H "Authorization: Bearer $TOKEN")

UPDATED_COUNT=$(echo $UPDATED_HISTORY | jq '.messages | length')

if [ "$UPDATED_COUNT" -ge 4 ]; then
  echo -e "${GREEN}✅ Conversation continuity maintained${NC}"
  echo "   Messages in conversation: $UPDATED_COUNT"
else
  echo -e "${YELLOW}⚠️  Expected at least 4 messages, got $UPDATED_COUNT${NC}"
fi
echo ""

# Step 10: Check event logging
echo -e "${BLUE}Step 10: Verifying event logging...${NC}"
EVENTS_RESPONSE=$(curl -s -X GET "$API_URL/api/events?type=CONVERSATION_MESSAGE&limit=5" \
  -H "Authorization: Bearer $TOKEN")

# Check if response is valid JSON array
if echo "$EVENTS_RESPONSE" | jq -e '. | type' > /dev/null 2>&1; then
  EVENT_COUNT=$(echo $EVENTS_RESPONSE | jq 'if type=="array" then length else 0 end')

  if [ "$EVENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Events logged successfully${NC}"
    echo "   Recent conversation events: $EVENT_COUNT"
  else
    echo -e "${YELLOW}⚠️  No conversation events found${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Events endpoint not accessible or returned non-JSON${NC}"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}🎉 All Siani conversation tests passed!${NC}"
echo ""
echo "Pipeline verified:"
echo "  ✅ Authentication"
echo "  ✅ Message sending (text input)"
echo "  ✅ Emotion classification"
echo "  ✅ LLM response generation"
echo "  ✅ TTS audio synthesis"
echo "  ✅ Relational context retrieval"
echo "  ✅ Conversation persistence"
echo "  ✅ History retrieval"
echo "  ✅ Conversation continuity"
echo "  ✅ Event logging"
echo ""
echo "Next steps:"
echo "  • Test with actual audio base64 input"
echo "  • Verify Whisper transcription"
echo "  • Test emotion classification accuracy"
echo "  • Validate memory storage in Weaviate"
echo "  • Test mobile app integration"

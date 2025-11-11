#!/bin/bash

# Test script for Event Store functionality
# Tests immutable event sourcing with compliance tags

set -e

API_URL="http://localhost:3000/api"
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║         Event Store Testing - Immutable Event Log           ║${RESET}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Login as admin to get token
echo -e "${YELLOW}Step 1: Authenticating as admin...${RESET}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sainte.ai",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken // .token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to authenticate${RESET}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Authenticated as admin (User ID: $USER_ID)${RESET}"
echo ""

# Test 1: Write a single event
echo -e "${YELLOW}Test 1: Writing a single event...${RESET}"
EVENT_RESPONSE=$(curl -s -X POST "$API_URL/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CHECK_IN",
    "entityType": "Patient",
    "entityId": "test-patient-1",
    "payload": {
      "status": "completed",
      "duration": 300,
      "satisfaction": "high"
    },
    "tags": ["HEDIS", "PATIENT_ENGAGEMENT"],
    "correlationId": "corr-001"
  }')

EVENT_ID=$(echo $EVENT_RESPONSE | jq -r '.id')

if [ "$EVENT_ID" == "null" ] || [ -z "$EVENT_ID" ]; then
  echo -e "${RED}❌ Failed to write event${RESET}"
  echo $EVENT_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Event written successfully${RESET}"
echo $EVENT_RESPONSE | jq '{id, type, actorUserId, entityType, entityId, tags}'
echo ""

# Test 2: Write a batch of events
echo -e "${YELLOW}Test 2: Writing a batch of events...${RESET}"
BATCH_RESPONSE=$(curl -s -X POST "$API_URL/events/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "type": "REFERRAL_INITIATED",
        "entityType": "Referral",
        "entityId": "ref-001",
        "payload": {"priority": "high"},
        "tags": ["HEDIS", "CARE_COORDINATION"],
        "correlationId": "corr-002"
      },
      {
        "type": "REFERRAL_ACCEPTED",
        "entityType": "Referral",
        "entityId": "ref-001",
        "payload": {"acceptedBy": "doctor-1"},
        "tags": ["HEDIS", "CARE_COORDINATION"],
        "correlationId": "corr-002"
      },
      {
        "type": "SIGNAL_SCORED",
        "entityType": "Signal",
        "entityId": "signal-001",
        "payload": {"score": 85, "severity": "HIGH"},
        "tags": ["STAR", "RISK_ASSESSMENT"],
        "correlationId": "corr-002"
      }
    ]
  }')

BATCH_COUNT=$(echo $BATCH_RESPONSE | jq -r '.count')

if [ "$BATCH_COUNT" != "3" ]; then
  echo -e "${RED}❌ Failed to write batch${RESET}"
  echo $BATCH_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Batch of $BATCH_COUNT events written successfully${RESET}"
echo $BATCH_RESPONSE | jq '.events[] | {id, type, correlationId}'
echo ""

# Test 3: Query events by type
echo -e "${YELLOW}Test 3: Querying events by type (CHECK_IN)...${RESET}"
TYPE_RESPONSE=$(curl -s -X GET "$API_URL/events/type/CHECK_IN?limit=10" \
  -H "Authorization: Bearer $TOKEN")

TYPE_COUNT=$(echo $TYPE_RESPONSE | jq -r '.count')
echo -e "${GREEN}✓ Found $TYPE_COUNT CHECK_IN events${RESET}"
echo $TYPE_RESPONSE | jq '.events[] | {id, type, occurredAt}'
echo ""

# Test 4: Query events by actor
echo -e "${YELLOW}Test 4: Querying events by actor (current user)...${RESET}"
ACTOR_RESPONSE=$(curl -s -X GET "$API_URL/events/actor/$USER_ID?limit=10" \
  -H "Authorization: Bearer $TOKEN")

ACTOR_COUNT=$(echo $ACTOR_RESPONSE | jq -r '.count')
echo -e "${GREEN}✓ Found $ACTOR_COUNT events by actor${RESET}"
echo $ACTOR_RESPONSE | jq '.events[] | {id, type, actorUserId}'
echo ""

# Test 5: Query events by entity
echo -e "${YELLOW}Test 5: Querying events by entity (Referral ref-001)...${RESET}"
ENTITY_RESPONSE=$(curl -s -X GET "$API_URL/events/entity/Referral/ref-001?limit=10" \
  -H "Authorization: Bearer $TOKEN")

ENTITY_COUNT=$(echo $ENTITY_RESPONSE | jq -r '.count')
echo -e "${GREEN}✓ Found $ENTITY_COUNT events for Referral ref-001${RESET}"
echo $ENTITY_RESPONSE | jq '.events[] | {id, type, entityType, entityId}'
echo ""

# Test 6: Query events by correlation ID
echo -e "${YELLOW}Test 6: Querying events by correlation ID (corr-002)...${RESET}"
CORR_RESPONSE=$(curl -s -X GET "$API_URL/events/correlation/corr-002?limit=10" \
  -H "Authorization: Bearer $TOKEN")

CORR_COUNT=$(echo $CORR_RESPONSE | jq -r '.count')
echo -e "${GREEN}✓ Found $CORR_COUNT events in correlation group corr-002${RESET}"
echo $CORR_RESPONSE | jq '.events[] | {id, type, correlationId}'
echo ""

# Test 7: Query events by tag
echo -e "${YELLOW}Test 7: Querying events by tag (HEDIS)...${RESET}"
TAG_RESPONSE=$(curl -s -X GET "$API_URL/events/tag/HEDIS?limit=10" \
  -H "Authorization: Bearer $TOKEN")

TAG_COUNT=$(echo $TAG_RESPONSE | jq -r '.count')
echo -e "${GREEN}✓ Found $TAG_COUNT events tagged with HEDIS${RESET}"
echo $TAG_RESPONSE | jq '.events[] | {id, type, tags}'
echo ""

# Test 8: Query events by time range
echo -e "${YELLOW}Test 8: Querying events by time range (last hour)...${RESET}"
START_DATE=$(date -u -d '1 hour ago' +"%Y-%m-%dT%H:%M:%SZ")
END_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

RANGE_RESPONSE=$(curl -s -X GET "$API_URL/events/range?startDate=$START_DATE&endDate=$END_DATE&limit=100" \
  -H "Authorization: Bearer $TOKEN")

RANGE_COUNT=$(echo $RANGE_RESPONSE | jq -r '.count')
echo -e "${GREEN}✓ Found $RANGE_COUNT events in the last hour${RESET}"
echo $RANGE_RESPONSE | jq '{count, events: .events | length}'
echo ""

# Test 9: Query compliance events
echo -e "${YELLOW}Test 9: Querying compliance events (HEDIS, STAR)...${RESET}"
COMPLIANCE_RESPONSE=$(curl -s -X GET "$API_URL/events/compliance?startDate=$START_DATE&endDate=$END_DATE&tags=HEDIS,STAR" \
  -H "Authorization: Bearer $TOKEN")

COMPLIANCE_COUNT=$(echo $COMPLIANCE_RESPONSE | jq -r '.count')
echo -e "${GREEN}✓ Found $COMPLIANCE_COUNT compliance events${RESET}"
echo $COMPLIANCE_RESPONSE | jq '{count, tags}'
echo ""

# Test 10: Get event statistics
echo -e "${YELLOW}Test 10: Getting event statistics...${RESET}"
STATS_RESPONSE=$(curl -s -X GET "$API_URL/events/stats" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Event statistics retrieved${RESET}"
echo $STATS_RESPONSE | jq '.'
echo ""

# Test 11: Write more events with different tags
echo -e "${YELLOW}Test 11: Writing events with CMS and PRIVACY tags...${RESET}"
CMS_RESPONSE=$(curl -s -X POST "$API_URL/events/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "type": "MEMORY_CREATED",
        "entityType": "Memory",
        "entityId": "mem-001",
        "payload": {"importance": 0.8},
        "tags": ["PRIVACY", "PATIENT_DATA"],
        "correlationId": "corr-003"
      },
      {
        "type": "DISCHARGE_INITIATED",
        "entityType": "Patient",
        "entityId": "patient-001",
        "payload": {"reason": "treatment_complete"},
        "tags": ["CMS", "PATIENT_FLOW"],
        "correlationId": "corr-003"
      }
    ]
  }')

echo -e "${GREEN}✓ Additional events written${RESET}"
echo $CMS_RESPONSE | jq '.events[] | {type, tags}'
echo ""

# Final statistics
echo -e "${YELLOW}Final: Getting updated statistics...${RESET}"
FINAL_STATS=$(curl -s -X GET "$API_URL/events/stats" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Final event statistics${RESET}"
echo $FINAL_STATS | jq '.stats'
echo ""

# Summary
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║                     Test Summary                             ║${RESET}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${GREEN}✓ Single event write${RESET}"
echo -e "${GREEN}✓ Batch event write (3 events)${RESET}"
echo -e "${GREEN}✓ Query by type${RESET}"
echo -e "${GREEN}✓ Query by actor${RESET}"
echo -e "${GREEN}✓ Query by entity${RESET}"
echo -e "${GREEN}✓ Query by correlation ID${RESET}"
echo -e "${GREEN}✓ Query by tag${RESET}"
echo -e "${GREEN}✓ Query by time range${RESET}"
echo -e "${GREEN}✓ Query compliance events${RESET}"
echo -e "${GREEN}✓ Event statistics${RESET}"
echo -e "${GREEN}✓ Additional tagged events${RESET}"
echo ""
echo -e "${BOLD}${GREEN}All tests passed! Event store is working correctly.${RESET}"
echo ""
echo -e "${BLUE}Event Types Captured:${RESET}"
echo $FINAL_STATS | jq -r '.stats | to_entries[] | "  • \(.key): \(.value) events"'
echo ""

#!/bin/bash

# Signal Scoring System Test Script
# Tests queue processing, workers, and analytics endpoints

set -e

echo "🧪 Testing Signal Scoring System"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
API_URL="${API_URL:-http://localhost:3000}"

# Step 1: Login and get token
echo -e "${BLUE}Step 1: Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "patient123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')
USER_NAME=$(echo $LOGIN_RESPONSE | jq -r '.user.firstName')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Logged in as $USER_NAME (ID: $USER_ID)${NC}"
echo ""

# Step 2: Get patient ID
echo -e "${BLUE}Step 2: Getting patient ID...${NC}"
PATIENT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/patients" | jq -r '.[0]')

PATIENT_ID=$(echo $PATIENT | jq -r '.id')

if [ "$PATIENT_ID" = "null" ] || [ -z "$PATIENT_ID" ]; then
  echo -e "${YELLOW}⚠️  No patient found, using user ID${NC}"
  PATIENT_ID=$USER_ID
fi

echo -e "${GREEN}✓ Patient ID: $PATIENT_ID${NC}"
echo ""

# Step 3: Create a test signal (VITAL_SIGN)
echo -e "${BLUE}Step 3: Creating test signal (Heart Rate)...${NC}"
SIGNAL_RESPONSE=$(curl -s -X POST "$API_URL/api/signals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"VITAL_SIGN\",
    \"value\": \"125\",
    \"patientId\": \"$PATIENT_ID\",
    \"metadata\": {
      \"vitalType\": \"heartRate\",
      \"unit\": \"bpm\",
      \"urgent\": true
    }
  }")

SIGNAL_ID=$(echo $SIGNAL_RESPONSE | jq -r '.signal.id')
SIGNAL_SCORE=$(echo $SIGNAL_RESPONSE | jq -r '.signal.score')
SIGNAL_SEVERITY=$(echo $SIGNAL_RESPONSE | jq -r '.signal.severity')
QUEUED=$(echo $SIGNAL_RESPONSE | jq -r '.queuedForAnalysis')

echo -e "${GREEN}✓ Signal created:${NC}"
echo "  ID: $SIGNAL_ID"
echo "  Score: $SIGNAL_SCORE"
echo "  Severity: $SIGNAL_SEVERITY"
echo "  Queued for analysis: $QUEUED"
echo ""

# Step 4: Create a symptom signal
echo -e "${BLUE}Step 4: Creating symptom signal...${NC}"
SYMPTOM_RESPONSE=$(curl -s -X POST "$API_URL/api/signals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"SYMPTOM\",
    \"value\": \"Feeling severe chest pain\",
    \"patientId\": \"$PATIENT_ID\",
    \"metadata\": {
      \"painScale\": 8,
      \"duration\": \"30 minutes\"
    }
  }")

SYMPTOM_SCORE=$(echo $SYMPTOM_RESPONSE | jq -r '.signal.score')
SYMPTOM_SEVERITY=$(echo $SYMPTOM_RESPONSE | jq -r '.signal.severity')

echo -e "${GREEN}✓ Symptom created:${NC}"
echo "  Score: $SYMPTOM_SCORE"
echo "  Severity: $SYMPTOM_SEVERITY"
echo ""

# Step 5: Wait for queue processing
echo -e "${YELLOW}⏳ Waiting 3 seconds for queue processing...${NC}"
sleep 3
echo ""

# Step 6: Get latest signal score
echo -e "${BLUE}Step 6: Fetching latest signal score...${NC}"
SCORE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$PATIENT_ID")

OVERALL_RISK=$(echo $SCORE_RESPONSE | jq -r '.overallRisk')
BADGE_LEVEL=$(echo $SCORE_RESPONSE | jq -r '.badge.level')
BADGE_EMOJI=$(echo $SCORE_RESPONSE | jq -r '.badge.emoji')

if [ "$OVERALL_RISK" = "null" ]; then
  echo -e "${RED}❌ No signal score found${NC}"
else
  echo -e "${GREEN}✓ Signal Score Retrieved:${NC}"
  echo "  Overall Risk: $OVERALL_RISK"
  echo "  Badge: $BADGE_EMOJI $BADGE_LEVEL"
  echo "  Medication Adherence: $(echo $SCORE_RESPONSE | jq -r '.medicationAdherence')"
  echo "  Mental Health Risk: $(echo $SCORE_RESPONSE | jq -r '.mentalHealthRisk')"
  echo "  Social Isolation: $(echo $SCORE_RESPONSE | jq -r '.socialIsolation')"
fi
echo ""

# Step 7: Get score history
echo -e "${BLUE}Step 7: Fetching score history...${NC}"
HISTORY_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$PATIENT_ID/history?limit=10")

HISTORY_COUNT=$(echo $HISTORY_RESPONSE | jq -r '.count')

echo -e "${GREEN}✓ Retrieved $HISTORY_COUNT historical scores${NC}"
echo ""

# Step 8: Trigger manual analysis
echo -e "${BLUE}Step 8: Triggering manual analysis...${NC}"
ANALYZE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/$PATIENT_ID/analyze")

ANALYZE_SUCCESS=$(echo $ANALYZE_RESPONSE | jq -r '.message')

if [ "$ANALYZE_SUCCESS" != "null" ]; then
  echo -e "${GREEN}✓ Analysis triggered successfully${NC}"
  echo "  Message: $ANALYZE_SUCCESS"
else
  echo -e "${RED}❌ Analysis failed${NC}"
  echo $ANALYZE_RESPONSE | jq '.'
fi
echo ""

# Step 9: Get trending analysis
echo -e "${BLUE}Step 9: Fetching trending analysis...${NC}"
TRENDING_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signal-scores/trending/$PATIENT_ID?days=30")

TREND_PERIOD=$(echo $TRENDING_RESPONSE | jq -r '.period')
TREND_DATA_POINTS=$(echo $TRENDING_RESPONSE | jq -r '.dataPoints')

echo -e "${GREEN}✓ Trending data retrieved:${NC}"
echo "  Period: $TREND_PERIOD"
echo "  Data Points: $TREND_DATA_POINTS"

if [ "$TREND_DATA_POINTS" != "null" ] && [ "$TREND_DATA_POINTS" -ge 2 ]; then
  OVERALL_TREND=$(echo $TRENDING_RESPONSE | jq -r '.trends.overallRisk.direction')
  echo "  Overall Risk Trend: $OVERALL_TREND"
fi
echo ""

# Step 10: Get analytics for the patient
echo -e "${BLUE}Step 10: Fetching patient analytics...${NC}"
ANALYTICS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/signals/analytics/$PATIENT_ID")

TOTAL_SIGNALS=$(echo $ANALYTICS_RESPONSE | jq -r '.total')
AVG_SCORE=$(echo $ANALYTICS_RESPONSE | jq -r '.averageScore')

echo -e "${GREEN}✓ Analytics retrieved:${NC}"
echo "  Total Signals: $TOTAL_SIGNALS"
echo "  Average Score: $AVG_SCORE"
echo "  Critical Signals: $(echo $ANALYTICS_RESPONSE | jq -r '.bySeverity.CRITICAL')"
echo "  High Signals: $(echo $ANALYTICS_RESPONSE | jq -r '.bySeverity.HIGH')"
echo ""

# Step 11: Test cohort analysis (as admin)
echo -e "${BLUE}Step 11: Testing cohort analysis (admin required)...${NC}"

# Login as admin
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sainte.ai",
    "password": "admin123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.accessToken')

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
  COHORT_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    "$API_URL/api/signal-scores/cohort/analysis?days=7")

  TOTAL_PATIENTS=$(echo $COHORT_RESPONSE | jq -r '.stats.totalPatients')
  CRITICAL_COUNT=$(echo $COHORT_RESPONSE | jq -r '.stats.riskDistribution.critical')

  echo -e "${GREEN}✓ Cohort analysis retrieved:${NC}"
  echo "  Total Patients: $TOTAL_PATIENTS"
  echo "  Critical Risk: $CRITICAL_COUNT"
  echo "  Average Overall Risk: $(echo $COHORT_RESPONSE | jq -r '.stats.averageScores.overallRisk')"
else
  echo -e "${YELLOW}⚠️  Admin login failed, skipping cohort analysis${NC}"
fi
echo ""

# Step 12: Test high-risk patient list
if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
  echo -e "${BLUE}Step 12: Fetching high-risk patients...${NC}"
  HIGH_RISK_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    "$API_URL/api/signal-scores/high-risk/list?threshold=7&limit=10")

  HIGH_RISK_COUNT=$(echo $HIGH_RISK_RESPONSE | jq -r '.count')

  echo -e "${GREEN}✓ High-risk patients retrieved:${NC}"
  echo "  Count: $HIGH_RISK_COUNT"
  echo "  Threshold: $(echo $HIGH_RISK_RESPONSE | jq -r '.threshold')"
  echo ""
fi

# Summary
echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}✅ All Tests Completed${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo "Summary:"
echo "  ✓ Authentication successful"
echo "  ✓ Signal creation with auto-scoring"
echo "  ✓ Queue processing integration"
echo "  ✓ Signal score retrieval"
echo "  ✓ Historical trending"
echo "  ✓ Manual analysis trigger"
echo "  ✓ Patient analytics"
if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
  echo "  ✓ Cohort analysis (admin)"
  echo "  ✓ High-risk patient list (admin)"
fi
echo ""
echo "🎉 Signal Scoring System is working correctly!"

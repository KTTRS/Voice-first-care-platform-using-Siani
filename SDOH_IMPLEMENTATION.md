# SDOH + Resource Intelligence Layer

## Overview

The **SDOH (Social Determinants of Health) + Resource Intelligence Layer** extends the Signal Score system with passive detection of social needs and comprehensive resource engagement tracking. This enables the care team to identify and address barriers to health beyond clinical factors.

---

## 🎯 Core Capabilities

### 1. **SDOH Need Detection**

Automatically detects social determinant indicators from patient interactions using rule-based keyword matching:

**Detected Need Types:**

- `food_insecurity` - "hungry", "can't afford food", "food bank"
- `housing_instability` - "evicted", "homeless", "can't pay rent"
- `transportation` - "no ride", "missed appointment", "no car"
- `financial_hardship` - "broke", "bills piling up", "lost job"
- `childcare` - "no babysitter", "can't find childcare"
- `health_literacy` - "don't understand", "confused by meds"
- `trust_in_system` - "doctors don't listen", "they don't care"
- `employment` - "unemployed", "need work", "laid off"
- `utilities` - "power shut off", "no electricity"
- `legal_assistance` - "legal trouble", "court", "custody"
- `safety_concerns` - "not safe", "domestic violence", "abuse"
- `social_isolation` - "completely alone", "no friends", "lonely"

**Detection Sources:**

- Memory Moments
- Goal descriptions
- Daily Action notes
- Referral outcomes

### 2. **Resource Loop Monitoring**

Tracks the complete lifecycle of resource interventions:

**Resource Lifecycle:**

```
OFFERED → ENGAGED → COMPLETED/FAILED/DECLINED
```

**Tracked Data:**

- Resource details (name, type, ID)
- Need type addressed
- Status progression
- Timestamps (offered, accepted, followed up, closed)
- Outcomes (success rating 1-5, impact notes)
- Decline reasons

### 3. **Impact Feedback Loop**

Resource completions dynamically update Signal Scores:

- Successful resource engagement **reduces** SDOH risk
- SDOH risk contributes to overall patient risk score
- Resource effectiveness metrics inform care strategies

---

## 📊 Database Schema

### ResourceEngagement Model

```prisma
model ResourceEngagement {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])

  resourceId      String
  resourceName    String
  resourceType    String
  needType        String    // food_insecurity, housing_instability, etc.

  status          String    // offered | engaged | completed | failed | declined

  offeredAt       DateTime  @default(now())
  acceptedAt      DateTime?
  followedUpAt    DateTime?
  closedAt        DateTime?

  successRating   Int?      // 1-5
  impactNotes     String?
  declineReason   String?
  offeredBy       String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([needType])
  @@map("resource_engagements")
}
```

### SignalScore Extensions

```prisma
model SignalScore {
  // ... existing fields ...
  detectedNeeds   String[]  @default([])  // Array of detected SDOH need types
  sdohRisk        Float     @default(0)   // 0-10 SDOH risk score
}
```

---

## 🔧 API Endpoints

### Get Detected SDOH Needs

```bash
GET /api/users/:id/sdoh-needs
```

**Response:**

```json
{
  "userId": "user123",
  "detectedNeeds": ["food_insecurity", "transportation", "financial_hardship"],
  "needCounts": {
    "food_insecurity": 3,
    "transportation": 2,
    "financial_hardship": 5
  },
  "riskLevel": 7.2,
  "riskBadge": "🔴 High"
}
```

### Get Resource Engagements

```bash
GET /api/users/:id/resource-loops?status=active|completed
```

**Response:**

```json
[
  {
    "id": "eng123",
    "resourceName": "Local Food Pantry Network",
    "resourceType": "food_assistance",
    "needType": "food_insecurity",
    "status": "completed",
    "successRating": 5,
    "impactNotes": "Patient received 2 weeks of groceries",
    "timestamps": {
      "offeredAt": "2025-11-01T10:00:00Z",
      "acceptedAt": "2025-11-01T14:30:00Z",
      "closedAt": "2025-11-05T16:00:00Z"
    }
  }
]
```

### Offer Resource

```bash
POST /api/users/:id/resource-loops/offer
```

**Request Body:**

```json
{
  "resourceName": "Emergency Transportation Vouchers",
  "resourceType": "transportation_assistance",
  "needType": "transportation"
}
```

**Authorization:** admin, doctor, nurse only

### Accept Resource

```bash
POST /api/users/:id/resource-loops/:engagementId/accept
```

**Authorization:** User can accept their own resources

### Decline Resource

```bash
POST /api/users/:id/resource-loops/:engagementId/decline
```

**Request Body:**

```json
{
  "reason": "Already found alternative solution"
}
```

### Complete Resource

```bash
POST /api/users/:id/resource-loops/:engagementId/complete
```

**Request Body:**

```json
{
  "successRating": 4,
  "impactNotes": "Patient successfully enrolled in housing assistance program"
}
```

**Authorization:** admin, doctor, nurse only

### Mark Resource as Failed

```bash
POST /api/users/:id/resource-loops/:engagementId/fail
```

**Request Body:**

```json
{
  "notes": "Resource no longer available in patient's area"
}
```

### Get Resource Engagement Stats

```bash
GET /api/users/:id/resource-loops/stats
```

**Response:**

```json
{
  "total": 12,
  "offered": 2,
  "engaged": 3,
  "completed": 5,
  "failed": 1,
  "declined": 1,
  "successRate": 0.833,
  "avgSuccessRating": 4.2,
  "needsAddressed": ["food_insecurity", "transportation", "housing_instability"]
}
```

### Get Comprehensive Snapshot

```bash
GET /api/users/:id/signal-snapshot
```

**Response:**

```json
{
  "userId": "user123",
  "signalScore": {
    "overallRisk": 6.2,
    "sdohRisk": 7.5,
    "detectedNeeds": ["food_insecurity", "financial_hardship"],
    "medicationAdherence": 5.5,
    "mentalHealthRisk": 6.0
  },
  "sdoh": {
    "detectedNeeds": ["food_insecurity", "transportation"],
    "needCounts": { "food_insecurity": 4, "transportation": 2 },
    "riskLevel": 7.5
  },
  "resources": {
    "total": 8,
    "completed": 5,
    "successRate": 0.833,
    "needsAddressed": ["food_insecurity"]
  },
  "timestamp": "2025-11-10T15:30:00Z"
}
```

---

## 🧪 Testing

Run the comprehensive SDOH test script:

```bash
./test-sdoh-detection.sh
```

**Test Coverage:**

1. ✅ SDOH detection from memory moments
2. ✅ SDOH needs analysis
3. ✅ Resource offering workflow
4. ✅ Resource acceptance
5. ✅ Resource completion with success rating
6. ✅ Resource loop history
7. ✅ Engagement statistics
8. ✅ Signal score integration
9. ✅ Comprehensive snapshot

---

## 🔍 SDOH Detection Logic

### Keyword Detector (`utils/sdohDetector.ts`)

```typescript
import { detectSDOH } from "../utils/sdohDetector";

const text = "I'm hungry and can't afford food this week";
const needs = detectSDOH(text);
// Returns: ["food_insecurity", "financial_hardship"]
```

### Integration Points

**Memory Moments:**

```typescript
// routes/memoryMoments.ts
const sdohFlags = detectSDOH(moment.content);
if (sdohFlags.length > 0) {
  await prisma.signalEvent.create({
    data: {
      userId: payload.userId,
      type: "SDOH_DETECTED",
      delta: sdohFlags.length * 0.5,
    },
  });
}
```

**Signal Engine Integration:**

```typescript
// services/signalEngine.service.ts
const sdohAnalysis = await analyzeUserSDOH(userId);
const resourceStats = await getResourceEngagementStats(userId);
const sdohImpact = calculateSDOHImpact(
  sdohAnalysis.detectedNeeds,
  resourceStats
);

// SDOH contributes to overall risk
const sdohRiskContribution = sdohAnalysis.riskLevel * 0.15; // Up to 1.5 points
const resourceImpactReduction = sdohImpact * 2; // Up to -2 points
const adjustedOverallRisk =
  overallRisk + sdohRiskContribution - resourceImpactReduction;
```

---

## 📈 Future Enhancements

### Phase 2: ML-Based Detection

- Replace keyword matching with embedding similarity search
- Use Weaviate vector DB for semantic SDOH detection
- Fine-tune LLM for nuanced need classification

### Phase 3: Conversational Resource Offering

- Siani AI proactively offers resources in natural conversation
- "I noticed you mentioned transportation challenges. Would you like information about our free ride program?"
- Track conversation context for follow-ups

### Phase 4: Closed-Loop Automation

- Auto-generate follow-up tasks for care coordinators
- Alert system when resource loops stall
- Predictive analytics for resource effectiveness

### Phase 5: External Integrations

- Connect to 211 databases for resource discovery
- Integrate with community resource platforms
- Bi-directional referral tracking with partner organizations

---

## 🎨 Dashboard UI

**Location:** `packages/dashboard/src/app/patients/[id]/sdoh/page.tsx`

**Features:**

- 📊 SDOH risk overview with badge (🔴 High, 🟠 Medium, 🟢 Low)
- 🏷️ Visual tags for detected needs with occurrence counts
- 📋 Resource engagement timeline
- ⭐ Success ratings display
- 📝 Impact notes and decline reasons
- 🔄 Real-time status indicators

**Route:** `/patients/:id/sdoh`

---

## 🔐 Authorization

- **View SDOH needs:** User (own data), admin, doctor, nurse
- **Offer resources:** admin, doctor, nurse only
- **Accept/Decline resources:** User (own resources only)
- **Complete/Fail resources:** admin, doctor, nurse only

---

## 📊 Scoring Impact

### SDOH Risk Calculation

```
Base SDOH Risk = (unique_needs * 1.5) + (total_mentions * 0.3)
Capped at 10.0
```

### Overall Risk Adjustment

```
Overall Risk = Base Risk + (SDOH Risk * 0.15) - (Resource Impact * 2.0)

Where:
- SDOH Risk contributes up to +1.5 points
- Successful resource engagement reduces up to -2.0 points
- Resource Impact = (needs_addressed / total_needs) × success_rate
```

---

## 🧑‍⚕️ Clinical Use Cases

### Use Case 1: Proactive Intervention

**Scenario:** Patient mentions "can't afford meds" in conversation  
**System Response:**

1. Detects `financial_hardship` SDOH flag
2. Raises SDOH risk score
3. Care coordinator sees alert in dashboard
4. Offers pharmaceutical assistance program
5. Patient accepts → enrolled → successful
6. SDOH risk decreases, overall patient risk improves

### Use Case 2: Pattern Recognition

**Scenario:** Multiple patients in same zip code report food insecurity  
**System Response:**

1. Aggregated SDOH analytics identify geographic cluster
2. Care team establishes partnership with local food bank
3. Bulk resource offering to affected patients
4. Track engagement and effectiveness metrics
5. Refine resource matching algorithms

### Use Case 3: Referral Loop Closure

**Scenario:** Patient referred to housing assistance, hasn't engaged  
**System Response:**

1. Resource status shows "offered" for 14 days
2. Dashboard highlights stalled loop
3. Care coordinator reaches out
4. Identifies barrier (transportation to office)
5. Offers virtual intake as alternative
6. Patient engages → completes → loop closes successfully

---

## 🚀 Deployment Status

| Component                 | Status        | Notes                        |
| ------------------------- | ------------- | ---------------------------- |
| SDOH Detection Service    | ✅ Ready      | Keyword-based, 12 need types |
| Resource Engagement DB    | ✅ Migrated   | Full lifecycle tracking      |
| API Endpoints (9 routes)  | ✅ Ready      | Full CRUD + stats            |
| Signal Engine Integration | ✅ Ready      | SDOH risk + resource impact  |
| Dashboard UI              | ✅ Scaffolded | Patient detail drill-down    |
| Test Suite                | ✅ Ready      | 9 comprehensive tests        |
| Documentation             | ✅ Complete   | This file                    |

---

## 📝 Key Files

- `src/utils/sdohDetector.ts` - Keyword-based detection logic
- `src/services/sdoh.service.ts` - SDOH analysis & resource management
- `src/services/signalEngine.service.ts` - Signal score integration
- `src/routes/sdoh.ts` - API endpoints
- `src/routes/memoryMoments.ts` - Real-time detection hooks
- `prisma/schema.prisma` - ResourceEngagement model
- `dashboard/src/app/patients/[id]/sdoh/page.tsx` - Care team UI
- `test-sdoh-detection.sh` - Test script

---

## ✨ Impact on Payer Value

### For Health Plans

- **Risk stratification:** Identify high-SDOH-risk members early
- **Cost avoidance:** Address upstream barriers before ER visits
- **Quality metrics:** HEDIS improvement through holistic care
- **Member retention:** Demonstrate tangible value beyond medical care

### For ACOs/Risk-Bearing Providers

- **Total cost of care:** Reduce preventable utilization
- **Quality bonuses:** Meet SDOH screening requirements
- **Attribution:** Keep members engaged in network
- **Documentation:** Capture social complexity for risk adjustment

### For Care Coordinators

- **Efficiency:** Auto-detect needs without manual screening
- **Effectiveness:** Track resource ROI with success ratings
- **Scalability:** Monitor 100s of patients simultaneously
- **Accountability:** Close-the-loop documentation

---

**🎉 SDOH + Resource Intelligence Layer - Production Ready**

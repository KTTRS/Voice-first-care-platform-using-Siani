# Signal Score Intelligence Layer - Implementation Complete

## 🎯 Overview

The Signal Score Intelligence Layer analyzes user behavior and interactions to generate real-time risk scores across multiple health and engagement categories. This system powers clinical insights, drives interventions, and provides metrics for payer value demonstration.

## ✅ Implementation Status: COMPLETE

### Database Schema

- **Model**: `SignalScore`
- **Location**: `packages/backend/prisma/schema.prisma`
- **Fields**:
  - Category Scores (0-10 scale): medicationAdherence, mentalHealthRisk, socialIsolation, careCoordination, systemTrust
  - Trends (-1 to 1): trendMedication, trendMentalHealth, trendSocial
  - Overall Risk: Weighted composite score
  - Metadata: totalMoments, totalGoalsCompleted, streakDays, lastActivityAt

### Core Service

- **File**: `packages/backend/src/services/signalEngine.service.ts`
- **Functions**:
  - `analyzeUserSignals()` - Real-time analysis
  - `processUserSignal()` - Process and save scores
  - `getLatestSignalScore()` - Get current score
  - `getSignalScoreHistory()` - Historical trends
  - `getRiskBadge()` - Visual risk indicator

### API Endpoints

- **Base Route**: `/api/signal-scores`
- **Endpoints**:
  - `GET /:userId` - Latest signal score
  - `GET /:userId/history` - Score history for trends
  - `POST /:userId/analyze` - Trigger real-time analysis
  - `GET /:userId/live` - Live analysis (no save)
  - `GET /high-risk/list` - High-risk patients (admin/provider only)

### Background Processing

- **Queue**: `signal-processing` (BullMQ + Redis)
- **Worker**: `packages/backend/src/jobs/workers/signal.worker.ts`
- **Scheduler**: `packages/backend/src/jobs/schedulers/dailySignalUpdate.ts`
- **Cron Schedule**: Daily at midnight
- **Dev Mode**: Also runs 30 seconds after startup

### Real-Time Triggers

Signal scores update automatically when:

- ✅ Memory moment created
- ✅ Goal created
- ✅ Goal completed
- ✅ Daily action completed
- ✅ Referral loop closed

## 📊 Scoring Categories

### 1. Medication Adherence (0-10)

**Sources**: Daily actions tagged with "medication"
**Logic**:

- Completion rate of medication actions
- Higher completion = lower risk
- 0 = Perfect adherence, 10 = No adherence

### 2. Mental Health Risk (0-10)

**Sources**: Memory moments with sentiment analysis
**Logic**:

- Negative keywords (hopeless, depressed, anxious, etc.)
- Positive keywords (happy, grateful, hopeful, etc.)
- Recent moment weighting
- 3+ negative keywords in one moment = +2 risk
- Recent negative trend = +2 risk

**Negative Keywords**:

```
hopeless, alone, depressed, anxious, scared, worried, sad, tired,
exhausted, give up, can't, won't, never, hate, angry
```

**Positive Keywords**:

```
happy, grateful, hopeful, excited, better, improved, great,
wonderful, love, appreciate, thankful, blessed
```

### 3. Social Isolation (0-10)

**Sources**: Memory moments, feed events, interaction frequency
**Logic**:

- Low activity in past 7 days = +3 risk
- No social keywords (friend, family, visit, talk, call, meet) = +2 risk
- Low feed engagement = +1 risk

### 4. Care Coordination (0-10)

**Sources**: Referral loops, goal completion
**Logic**:

- Failed/cancelled referrals
- Goal completion rate
- Combined success metrics

### 5. System Trust (0-10)

**Sources**: Engagement patterns, negative system feedback
**Logic**:

- Days since last activity (14+ days = +3 risk)
- Negative sentiment about system/app/support
- Cancelled referrals

## 🎨 Risk Badges

| Overall Risk | Badge    | Color  | Emoji |
| ------------ | -------- | ------ | ----- |
| 7-10         | Critical | Red    | 🔴    |
| 4-6.9        | Watch    | Orange | 🟠    |
| 0-3.9        | Stable   | Green  | 🟢    |

## 🔄 Data Flow

```
User Action (Goal, Moment, Action)
    ↓
Trigger Signal Update
    ↓
Add to Signal Queue (Redis/BullMQ)
    ↓
Signal Worker Processes Job
    ↓
Analyze User Signals (5 categories)
    ↓
Calculate Trends (compare to historical)
    ↓
Save SignalScore to Database
    ↓
Available via API
```

## 📈 API Usage Examples

### Get Latest Score

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/signal-scores/USER_ID
```

**Response**:

```json
{
  "id": "...",
  "userId": "...",
  "medicationAdherence": 2.5,
  "mentalHealthRisk": 6.0,
  "socialIsolation": 4.2,
  "careCoordination": 3.1,
  "systemTrust": 2.8,
  "overallRisk": 4.1,
  "trendMedication": 0.2,
  "trendMentalHealth": -0.3,
  "trendSocial": 0.1,
  "badge": {
    "level": "Watch",
    "color": "orange",
    "emoji": "🟠"
  }
}
```

### Trigger Real-Time Analysis

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/signal-scores/USER_ID/analyze
```

### Get Score History

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/signal-scores/USER_ID/history?limit=30"
```

### Get High-Risk Patients (Admin/Provider Only)

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/signal-scores/high-risk/list?threshold=7&limit=20"
```

## 🔒 Authorization

- **Patients**: Can only view their own scores
- **Providers/Admin**: Can view all patient scores
- **High-Risk List**: Admin/Doctor/Nurse only

## 🧪 Testing

### Manual Trigger

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"patient123"}' \
  | jq -r '.accessToken')

# Get user ID
USER_ID=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"patient123"}' \
  | jq -r '.user.id')

# Trigger analysis
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/signal-scores/$USER_ID/analyze | jq '.'

# Get latest score
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/signal-scores/$USER_ID | jq '.'
```

### Create Test Data

```bash
# Create a memory moment with negative sentiment
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/memory-moments \
  -d '{
    "userId": "'$USER_ID'",
    "content": "Feeling hopeless and alone today",
    "emotion": "sad",
    "tone": "negative",
    "vectorId": "test-vector-1"
  }'

# Wait for signal update (async)
sleep 2

# Check updated score
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/signal-scores/$USER_ID | jq '.mentalHealthRisk'
```

## 📊 Frontend Integration

### React/Next.js Example

```typescript
async function getPatientSignals(userId: string) {
  const response = await fetch(`/api/signal-scores/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  return {
    scores: {
      medication: data.medicationAdherence,
      mental: data.mentalHealthRisk,
      social: data.socialIsolation,
      care: data.careCoordination,
      trust: data.systemTrust,
    },
    overall: data.overallRisk,
    badge: data.badge,
    trends: {
      medication: data.trendMedication,
      mental: data.trendMentalHealth,
      social: data.trendSocial,
    },
  };
}
```

### Chart Component (Pseudocode)

```typescript
// Fetch history
const history = await fetch(`/api/signal-scores/${userId}/history?limit=30`);

// Display trend chart
<LineChart data={history.scores.map(s => ({
  date: s.createdAt,
  medication: s.medicationAdherence,
  mental: s.mentalHealthRisk,
  social: s.socialIsolation,
}))} />

// Display risk badge
<Badge
  color={badge.color}
  emoji={badge.emoji}
>
  {badge.level}
</Badge>
```

## 🚀 Next Steps

### Immediate (Done)

- ✅ Database schema
- ✅ Scoring engine service
- ✅ API endpoints
- ✅ Background worker
- ✅ Daily scheduler
- ✅ Real-time triggers

### Phase 2 (Future)

- [ ] ML-based scoring (replace keyword rules)
- [ ] OpenAI embeddings for semantic analysis
- [ ] Voice signal integration (prosody analysis)
- [ ] Predictive risk modeling
- [ ] Dashboard visualizations
- [ ] Provider alerts for critical patients
- [ ] Patient-facing insights

### Phase 3 (Advanced)

- [ ] Cohort analysis
- [ ] Population health metrics
- [ ] Payer reporting integration
- [ ] Intervention recommendations
- [ ] Outcome tracking
- [ ] A/B testing for interventions

## 📝 Key Files

```
packages/backend/
├── prisma/
│   └── schema.prisma                    # SignalScore model
├── src/
│   ├── services/
│   │   └── signalEngine.service.ts      # Core scoring logic
│   ├── routes/
│   │   └── signalScores.ts              # API endpoints
│   ├── jobs/
│   │   ├── queues/
│   │   │   └── signalQueue.ts           # BullMQ queue
│   │   ├── workers/
│   │   │   └── signal.worker.ts         # Background processor
│   │   └── schedulers/
│   │       └── dailySignalUpdate.ts     # Cron scheduler
│   └── index.ts                         # App initialization
```

## 🎯 Success Metrics

- **Clinical Value**: Early identification of at-risk patients
- **Provider Value**: Prioritized intervention lists
- **Payer Value**: Quantifiable engagement and risk metrics
- **Patient Value**: Personalized care based on real behavior

## 🔍 Monitoring

- Worker logs: Signal processing success/failure rates
- Queue metrics: Job completion times, backlog
- API metrics: Endpoint usage, response times
- Score distribution: Population health overview

---

**Status**: ✅ PRODUCTION READY
**Version**: 1.0.0
**Last Updated**: 2025-11-10

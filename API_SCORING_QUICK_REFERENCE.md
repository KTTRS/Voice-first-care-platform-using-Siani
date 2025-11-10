# API Scoring Quick Reference

## 🎯 New Analytics Endpoints (v2.0)

### Trending Analysis

```bash
GET /api/signal-scores/trending/:userId?days=30
```

**Returns**: Trend direction (increasing/decreasing/stable) for all risk categories

### Cohort Analysis (Admin/Provider)

```bash
GET /api/signal-scores/cohort/analysis?days=7
```

**Returns**: Population-level statistics, risk distribution, category alerts

### Alert Checking (Admin/Provider)

```bash
POST /api/signal-scores/alerts/:userId
Body: { "thresholds": { "overallRisk": 7.0 }, "notifyProvider": true }
```

**Returns**: List of exceeded thresholds with current values

### Batch Analysis (Admin Only)

```bash
POST /api/signal-scores/batch/analyze
Body: { "userIds": [...], "reason": "manual_check" }
```

**Returns**: Queue confirmation

## 📊 Scoring Weights

| Signal Type | Base | Critical Multiplier |
| ----------- | ---- | ------------------- |
| VITAL_SIGN  | 50   | 3.0x                |
| SYMPTOM     | 40   | 3.5x                |
| MEDICATION  | 30   | 2.5x                |
| MOOD        | 25   | 2.8x                |
| ACTIVITY    | 20   | 2.0x                |

## 🔥 Risk Badges

| Score | Badge    | Emoji | Action              |
| ----- | -------- | ----- | ------------------- |
| 7-10  | Critical | 🔴    | Immediate attention |
| 4-6.9 | Watch    | 🟠    | Review soon         |
| 0-3.9 | Stable   | 🟢    | Routine monitoring  |

## ⚡ Queue System

- **Concurrency**: 5 workers
- **Rate Limit**: 10 jobs/second
- **Retry**: 3 attempts with exponential backoff
- **Debounce**: 5 minutes per patient

## 🧪 Quick Test

```bash
./test-scoring-system.sh
```

## 📈 Example: Create High-Risk Signal

```bash
curl -X POST http://localhost:3000/api/signals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SYMPTOM",
    "value": "Severe chest pain",
    "patientId": "uuid",
    "metadata": {
      "painScale": 9,
      "urgent": true,
      "duration": "20 minutes"
    }
  }'
```

**Expected Score**: ~140 (40 base × 3.5 CRITICAL × 1.5 urgent × 1.1 patient-reported)
**Capped at**: 100
**Result**: CRITICAL severity, queued for analysis

## 🔄 Data Flow

```
Signal Created → Scored → Queued → Worker Processes → Risk Updated → Available via API
```

## 🎨 Frontend Usage

```typescript
// Get patient risk with trending
const { score, trending } = usePatientRisk(userId);

// Display badge
<RiskBadge level={score.badge.level} emoji={score.badge.emoji} />

// Show trend
<TrendIndicator
  direction={trending.trends.overallRisk.direction}
  change={trending.trends.overallRisk.percentChange}
/>
```

## 📅 Scheduler

- **Production**: Midnight daily
- **Development**: 30s after startup (5 patients)
- **Mechanism**: BullMQ queue (non-blocking)

## 🔒 Permissions

- **Patient**: Own scores only
- **Nurse/Doctor**: All patient scores, trending, alerts
- **Admin**: Everything + cohort analysis + batch operations

---

**Full Documentation**: See `API_SCORING_IMPLEMENTATION.md`

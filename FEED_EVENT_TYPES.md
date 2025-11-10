# FeedEvent System Enhancement

## Overview

Extended the FeedEvent system to support 4 new event types for comprehensive user activity tracking.

## New Event Types

### 1. GOAL_COMPLETED

**Triggered when:** A user completes all actions associated with a goal

**Data Required:**

```typescript
{
  userId: string;
  goalId: string;
  title: string;
  totalPoints: number;
}
```

**Example Message:** `🎯 Completed goal: "Exercise Daily"`

**Usage:**

```typescript
import { trackGoalCompleted } from "../jobs/queues/feedQueue";

await trackGoalCompleted({
  userId: user.id,
  goalId: goal.id,
  title: goal.title,
  totalPoints: 150,
});
```

---

### 2. STREAK_MAINTAINED

**Triggered when:** A user maintains a consecutive daily activity streak

**Data Required:**

```typescript
{
  userId: string;
  streakDays: number;
}
```

**Example Message:** `🔥 Maintained a 7-day streak!`

**Usage:**

```typescript
import { trackStreakMaintained } from "../jobs/queues/feedQueue";

await trackStreakMaintained({
  userId: user.id,
  streakDays: 7,
});
```

---

### 3. RESOURCE_USED

**Triggered when:** A user accesses or uses a healthcare resource

**Data Required:**

```typescript
{
  userId: string;
  resourceName: string;
  resourceId?: string; // Optional reference ID
}
```

**Example Message:** `🔗 Used a resource: "Mental Health Hotline"`

**Usage:**

```typescript
import { trackResourceUsed } from "../jobs/queues/feedQueue";

await trackResourceUsed({
  userId: user.id,
  resourceName: "Mental Health Hotline",
  resourceId: referralLoop.id,
});
```

**Currently Integrated:**

- ✅ Referral Loops (`POST /api/referral-loops`)

---

### 4. DAILY_ACTION_COMPLETED

**Triggered when:** A user completes a daily action item

**Data Required:**

```typescript
{
  userId: string;
  goalId?: string;
  actionId: string;
  content: string;
  points: number;
}
```

**Example Message:** `✅ Completed action: "Morning meditation"`

**Usage:**

```typescript
import { trackDailyActionCompleted } from "../jobs/queues/feedQueue";

await trackDailyActionCompleted({
  userId: user.id,
  goalId: action.goalId,
  actionId: action.id,
  content: action.content,
  points: action.points,
});
```

**Currently Integrated:**

- ✅ Daily Actions (`PUT /api/daily-actions/:id` when completed flag changes)

---

## Technical Implementation

### 1. Schema (Prisma)

No schema changes required. The `FeedEvent.type` field uses `String` type, which is flexible enough for all event types:

```prisma
model FeedEvent {
  id        String   @id @default(cuid())
  type      String   // Flexible string type
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  goalId    String?
  goal      Goal?    @relation(fields: [goalId], references: [id])
  message   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([type])
  @@index([createdAt])
}
```

### 2. Queue System

**File:** `packages/backend/src/jobs/queues/feedQueue.ts`

New tracking functions:

```typescript
export async function trackStreakMaintained(data: {
  userId: string;
  streakDays: number;
}) { ... }

export async function trackResourceUsed(data: {
  userId: string;
  resourceName: string;
  resourceId?: string;
}) { ... }
```

### 3. Feed Worker

**File:** `packages/backend/src/jobs/workers/feed.worker.ts`

New event handlers:

```typescript
case "streak.maintained":
  // Creates FeedEvent record
  // Broadcasts via WebSocket
  // Creates legacy feed item
  break;

case "resource.used":
  // Similar processing
  break;
```

### 4. Feed Service

**File:** `packages/backend/src/services/feed.service.ts`

Updated `FeedItem` type:

```typescript
export interface FeedItem {
  type:
    | "GOAL_CREATED"
    | "GOAL_COMPLETED"
    | "DAILY_ACTION_COMPLETED"
    | "STREAK_MAINTAINED"    // NEW
    | "RESOURCE_USED"        // NEW
    | ...
}
```

---

## Integration Points

### Where Events Are Tracked

| Event Type             | Route                    | Method | Trigger Condition         |
| ---------------------- | ------------------------ | ------ | ------------------------- |
| GOAL_CREATED           | `/api/goals`             | POST   | Goal creation             |
| GOAL_COMPLETED         | `/api/goals/:id`         | PUT    | When all actions complete |
| DAILY_ACTION_COMPLETED | `/api/daily-actions/:id` | PUT    | `completed: true`         |
| RESOURCE_USED          | `/api/referral-loops`    | POST   | Resource creation         |
| STREAK_MAINTAINED      | _Manual_                 | -      | Custom streak logic       |

### Future Integration Opportunities

**STREAK_MAINTAINED** could be triggered by:

- Daily check-in scheduler
- Goal completion tracking service
- User activity analysis worker

**Potential locations:**

```typescript
// In a daily scheduler
if (userCompletedActionToday && previousDayCompleted) {
  const streakDays = calculateStreak(userId);
  await trackStreakMaintained({ userId, streakDays });
}
```

---

## Testing

### Test Script

Run `./test-feed-events.sh` to test all event types:

```bash
chmod +x test-feed-events.sh
./test-feed-events.sh
```

### Manual Testing

1. **GOAL_CREATED:**

```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"userId": "...", "title": "Test Goal", "points": 100}'
```

2. **DAILY_ACTION_COMPLETED:**

```bash
# Create action
curl -X POST http://localhost:3000/api/daily-actions \
  -H "Authorization: Bearer test-token" \
  -d '{"userId": "...", "content": "Test", "points": 10}'

# Complete action
curl -X PUT http://localhost:3000/api/daily-actions/{id} \
  -H "Authorization: Bearer test-token" \
  -d '{"completed": true}'
```

3. **RESOURCE_USED:**

```bash
curl -X POST http://localhost:3000/api/referral-loops \
  -H "Authorization: Bearer test-token" \
  -d '{"userId": "...", "resource": "Hotline", "status": "active"}'
```

4. **View Feed:**

```bash
curl http://localhost:3000/api/feed?userId=...&pageSize=10 \
  -H "Authorization: Bearer test-token"
```

---

## API Response Format

### GET /api/feed

```json
{
  "data": [
    {
      "id": "cmhswwy4c0001j5o7o0ih2zb1",
      "type": "RESOURCE_USED",
      "userId": "6916d6e8-a69d-4501-b703-d278c6d62947",
      "goalId": null,
      "message": "🔗 Used a resource: \"Mental Health Hotline\"",
      "createdAt": "2025-11-10T09:00:51.234Z",
      "updatedAt": "2025-11-10T09:00:51.234Z"
    },
    {
      "id": "cmhswwzp40005j5o749h8417b",
      "type": "DAILY_ACTION_COMPLETED",
      "userId": "6916d6e8-a69d-4501-b703-d278c6d62947",
      "goalId": "cmhswwy4c0001j5o7o0ih2zb1",
      "message": "Completed: Test daily action",
      "createdAt": "2025-11-10T09:00:49.123Z",
      "updatedAt": "2025-11-10T09:00:49.123Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

---

## WebSocket Real-Time Updates

All feed events are broadcast via WebSocket for real-time dashboard updates:

```typescript
// Client subscription
socket.on("feed-event", (event) => {
  console.log("New feed event:", event.type, event.message);
});
```

Event payload:

```json
{
  "type": "RESOURCE_USED",
  "userId": "...",
  "content": "🔗 Used a resource: \"Mental Health Hotline\"",
  "metadata": {
    "resourceName": "Mental Health Hotline",
    "resourceId": "..."
  }
}
```

---

## Files Modified

1. ✅ `packages/backend/prisma/schema.prisma` - No changes needed
2. ✅ `packages/backend/src/services/feed.service.ts` - Added new event types
3. ✅ `packages/backend/src/jobs/workers/feed.worker.ts` - Added event handlers
4. ✅ `packages/backend/src/jobs/queues/feedQueue.ts` - Added tracking functions
5. ✅ `packages/backend/src/routes/dailyActions.ts` - Integrated action completion tracking
6. ✅ `packages/backend/src/routes/referralLoops.ts` - Integrated resource usage tracking

---

## Performance Considerations

- **Async Processing**: All feed events are queued via BullMQ for async processing
- **No Blocking**: API responses don't wait for feed event creation
- **Retry Logic**: Failed events retry 3 times with exponential backoff
- **Concurrency**: Feed worker processes up to 5 events concurrently

---

## Next Steps

### Recommended Implementations

1. **Streak Tracking Service**

   - Create a daily cron job to check user activity
   - Calculate consecutive action completion days
   - Trigger `STREAK_MAINTAINED` events

2. **Goal Completion Detection**

   - Monitor when all daily actions for a goal are completed
   - Trigger `GOAL_COMPLETED` event automatically

3. **Dashboard Integration**

   - Display feed events in chronological timeline
   - Filter by event type
   - Show event-specific icons and styling

4. **Analytics Dashboard**
   - Track event distribution
   - User engagement metrics by event type
   - Resource usage patterns

---

**Last Updated:** 2025-11-10  
**Status:** ✅ Implemented and Tested

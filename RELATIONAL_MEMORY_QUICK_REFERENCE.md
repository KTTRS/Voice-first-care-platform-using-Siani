# Relational Memory System - Quick Reference

## 🚀 Quick Start

### Store a Conversation Memory

```bash
curl -X POST http://localhost:3000/api/memory/relational/store \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "transcript": "I have been feeling really stressed about work",
    "emotion": "anxious",
    "emotionVector": [0.2, 0.7, 0.1],
    "topics": ["work", "stress"]
  }'
```

### Retrieve Contextual Memories

```bash
curl "http://localhost:3000/api/memory/relational/context/user-123?transcript=still+stressed&emotion=anxious&emotionVector=%5B0.2%2C0.7%2C0.1%5D&limit=5"
```

### Get Relational Metrics

```bash
curl http://localhost:3000/api/memory/relational/metrics/user-123
```

---

## 📊 Emotion Vector Format

Emotion vectors are 3-element arrays: `[calm, guarded, lit]`

Each value is 0-1, and they should sum to 1.0.

**Examples:**

- `[0.8, 0.1, 0.1]` → Calm (peaceful, relaxed)
- `[0.2, 0.7, 0.1]` → Guarded (anxious, cautious, withdrawn)
- `[0.2, 0.1, 0.7]` → Lit (excited, energized, expressive)
- `[0.4, 0.4, 0.2]` → Mixed state

---

## 🎯 Relational Metrics

### Trust Index (0-1)

Frequency of emotionally vulnerable/open moments.

- **0.7-1.0**: High trust (frequent vulnerability, openness)
- **0.4-0.6**: Moderate trust (neutral, mixed emotions)
- **0.0-0.3**: Low trust (guarded, detached)

### Resonance Index (0-1)

Emotional convergence between user and Siani.

- **0.7-1.0**: High resonance (aligned responses)
- **0.4-0.6**: Moderate resonance
- **0.0-0.3**: Low resonance (misalignment)

### Continuity Score (0-1)

Topical and emotional overlap between sessions.

- **0.7-1.0**: High continuity (recurring themes)
- **0.4-0.6**: Medium continuity (some overlap)
- **0.0-0.3**: Low continuity (new topics)

---

## 🔍 Similarity Search

Memories are retrieved based on **emotional similarity** using cosine distance.

- **Threshold**: Cosine similarity > 0.75
- **Limit**: Top 5 most similar memories (configurable)
- **Algorithm**: `dotProduct / (magnitudeA * magnitudeB)`

---

## 🛠️ TypeScript Integration

### Import Service

```typescript
import { relationalMemoryService } from "../services/relationalMemory.service";
```

### Store Conversation

```typescript
await relationalMemoryService.storeConversation(
  userId,
  transcript,
  emotion,
  emotionVector, // [calm, guarded, lit]
  topics, // ["work", "stress"]
  prosodyData // optional
);
```

### Retrieve Context

```typescript
const context = await relationalMemoryService.retrieveContext(
  userId,
  currentTranscript,
  currentEmotion,
  currentEmotionVector,
  5 // limit
);

// Use context.contextPrompt in Siani's response generation
console.log(context.contextPrompt);
// → "Remember: we've talked about work stress 3 times. Trust level is high (0.78)."
```

### Get Metrics

```typescript
const metrics = await relationalMemoryService.getRelationalMetrics(userId);
console.log(metrics?.trustIndex); // 0.78
console.log(metrics?.emotionalProfile); // { calm: 0.35, guarded: 0.50, lit: 0.15 }
```

---

## 🔗 Integration Points

### Signal Engine

```typescript
const trustBoost = relationalContext.trustIndex * 0.2;
const adjustedSignal = baseSignalScore + trustBoost;
```

### Avatar Layer

```typescript
const recalledEmotion = context.emotionalContext.dominantEmotion;
const hue = emotionToHue(recalledEmotion);
avatar.setGlowColor(hue);
```

### Resource Engine

```typescript
const topTopics = relationalContext.topics.slice(0, 5);
if (topTopics.includes("housing") && context.emotionalProfile.guarded > 0.6) {
  suggestResource("housing-assistance", "high-priority");
}
```

---

## 📝 Schema Reference

### RelationalMemory

```prisma
model RelationalMemory {
  id            String   @id @default(cuid())
  userId        String
  content       String
  emotionVector String   // JSON: [calm, guarded, lit]
  topics        String   // JSON: array of topics
  embedding     String   // JSON: embedding vector
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### RelationalContext

```prisma
model RelationalContext {
  id                String   @id @default(cuid())
  userId            String   @unique
  topics            String   // JSON: recurring topics
  emotionVectorMean String   // JSON: average emotion
  trustIndex        Float    @default(0.5)
  resonanceIndex    Float    @default(0.5)
  continuityScore   Float    @default(0.5)
  lastUpdate        DateTime @default(now())
}
```

---

## 🐛 Troubleshooting

### "Property 'relationalMemory' does not exist"

**Fix**: Regenerate Prisma client

```bash
cd packages/backend
npx prisma generate
```

### "No relational context found for user"

**Fix**: First conversation will create new RelationalContext automatically.

### Low similarity matches

**Fix**: Check emotion vector normalization

```typescript
const sum = emotionVector.reduce((a, b) => a + b, 0);
if (Math.abs(sum - 1.0) > 0.01) {
  console.warn("Emotion vector should sum to 1.0");
}
```

---

## 📚 Full Documentation

See `RELATIONAL_MEMORY_COMPLETE.md` for comprehensive implementation guide.

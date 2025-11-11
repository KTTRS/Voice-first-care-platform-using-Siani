# Relational Memory System - Complete Implementation Guide

## Overview

The Relational Memory System is a **vector-based knowledge layer** that stores conversation embeddings with emotional context, enabling Siani to maintain long-term relationship memory and retrieve contextually relevant information based on emotional similarity.

**Key Features:**

- 📚 **Knowledge Graph**: User → Topic → EmotionTrajectory
- 🧠 **Emotional Context**: Conversation embeddings combined with emotion vectors (calm, guarded, lit)
- 🔍 **Similarity Search**: Retrieve memories with cosine similarity > 0.75
- 📊 **Relational Metrics**: Trust Index, Resonance Index, Continuity Score
- 🔗 **Integration Points**: Signal Engine, Avatar Layer, Resource Engine

---

## Architecture

### Data Models

#### RelationalMemory (Prisma)

Stores individual conversation memories with emotional context.

```prisma
model RelationalMemory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Content and context
  content   String   // The conversation content
  emotionVector String // JSON: [calm, guarded, lit] scores
  topics    String   // JSON: array of topic strings

  // Vector embedding for similarity search
  embedding String   // JSON: conversation embedding vector

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([createdAt])
  @@map("relational_memories")
}
```

#### RelationalContext (Prisma)

Aggregates relational metrics and emotional patterns over time.

```prisma
model RelationalContext {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Aggregated relational metrics
  topics    String   // JSON: array of recurring topics
  emotionVectorMean String // JSON: average emotional state

  // Trust and continuity scores (0-1)
  trustIndex      Float @default(0.5) // Frequency of emotionally open moments
  resonanceIndex  Float @default(0.5) // Emotional convergence with Siani
  continuityScore Float @default(0.5) // Emotional/topical overlap between sessions

  lastUpdate DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
  @@map("relational_contexts")
}
```

---

## Service Implementation

### RelationalMemoryService

**Location**: `packages/backend/src/services/relationalMemory.service.ts`

#### Core Methods

##### 1. `storeConversation()`

Store a conversation memory with emotional context.

```typescript
async storeConversation(
  userId: string,
  transcript: string,
  emotion: EmotionLevel,
  emotionVector: number[], // [calm, guarded, lit]
  topics: string[],
  prosodyData?: ProsodyData
): Promise<void>
```

**Process:**

1. Generate text embedding from transcript (1536d)
2. If prosody data provided, combine text + prosody embeddings (1540d)
3. Store in `RelationalMemory` table
4. Update user's `RelationalContext` with aggregated metrics

**Example Usage:**

```typescript
await relationalMemoryService.storeConversation(
  "user-123",
  "I've been feeling really stressed about work lately",
  "anxious",
  [0.2, 0.7, 0.1], // calm, guarded, lit
  ["work", "stress", "anxiety"]
);
```

---

##### 2. `retrieveContext()`

Retrieve contextually relevant memories based on emotional similarity.

```typescript
async retrieveContext(
  userId: string,
  currentTranscript: string,
  currentEmotion: EmotionLevel,
  currentEmotionVector: number[],
  limit: number = 5
): Promise<MemoryRetrievalResult>
```

**Process:**

1. Fetch user's relational context
2. Query similar memories from database
3. Compute emotional similarity (cosine distance)
4. Filter by similarity threshold (> 0.75)
5. Return top matches with relational cues

**Returns:**

```typescript
interface MemoryRetrievalResult {
  memories: StoredMemory[];
  emotionalContext: {
    dominantEmotion: EmotionLevel;
    emotionVector: number[];
    similarMoods: number;
  };
  relationalCues: {
    trustLevel: number; // 0-1
    familiarity: number; // 0-1
    continuity: number; // 0-1
  };
  contextPrompt: string; // Summarized context for Siani
}
```

**Example Response:**

```json
{
  "memories": [
    {
      "id": "mem_xyz",
      "content": "Last week we talked about your job stress",
      "emotionVector": "[0.3, 0.6, 0.1]",
      "topics": "[\"work\", \"stress\"]",
      "emotionSimilarity": 0.92
    }
  ],
  "emotionalContext": {
    "dominantEmotion": "guarded",
    "emotionVector": [0.25, 0.65, 0.1],
    "similarMoods": 3
  },
  "relationalCues": {
    "trustLevel": 0.78,
    "familiarity": 0.85,
    "continuity": 0.67
  },
  "contextPrompt": "Remember: we've talked about work stress 3 times. Trust level is high (0.78). User tends toward guarded emotions when discussing work."
}
```

---

##### 3. `getRelationalMetrics()`

Get aggregated relational metrics for dashboards/clinicians.

```typescript
async getRelationalMetrics(userId: string): Promise<{
  trustIndex: number;
  resonanceIndex: number;
  continuityScore: number;
  conversationCount: number;
  emotionalProfile: {
    calm: number;
    guarded: number;
    lit: number;
  };
  topics: string[];
} | null>
```

**Example Response:**

```json
{
  "trustIndex": 0.78,
  "resonanceIndex": 0.62,
  "continuityScore": 0.71,
  "conversationCount": 24,
  "emotionalProfile": {
    "calm": 0.35,
    "guarded": 0.5,
    "lit": 0.15
  },
  "topics": ["work", "stress", "family", "sleep", "health"]
}
```

---

## API Routes

**Location**: `packages/backend/src/routes/relationalMemory.routes.ts`

### Endpoints

#### 1. Store Conversation Memory

```http
POST /api/memory/relational/store
Content-Type: application/json

{
  "userId": "user-123",
  "transcript": "I've been feeling really anxious about my job",
  "emotion": "anxious",
  "emotionVector": [0.2, 0.7, 0.1],
  "topics": ["work", "anxiety"],
  "prosodyData": {
    "pitch": 180,
    "energy": 0.6,
    "speechRate": 150
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Conversation memory stored successfully"
}
```

---

#### 2. Retrieve Contextual Memories

```http
GET /api/memory/relational/context/:userId?transcript=feeling+anxious&emotion=anxious&emotionVector=[0.2,0.7,0.1]&limit=5
```

**Response:**

```json
{
  "success": true,
  "context": {
    "memories": [...],
    "emotionalContext": {...},
    "relationalCues": {...},
    "contextPrompt": "..."
  }
}
```

---

#### 3. Get Relational Metrics

```http
GET /api/memory/relational/metrics/:userId
```

**Response:**

```json
{
  "success": true,
  "metrics": {
    "trustIndex": 0.78,
    "resonanceIndex": 0.62,
    "continuityScore": 0.71,
    "conversationCount": 24,
    "emotionalProfile": {
      "calm": 0.35,
      "guarded": 0.5,
      "lit": 0.15
    },
    "topics": ["work", "stress", "family"]
  }
}
```

---

## Relational Continuity Scoring

### 1. Trust Index (0-1)

**Definition**: Frequency of emotionally vulnerable/open moments.

**Calculation**:

```typescript
const vulnerabilityMap: Record<EmotionLevel, number> = {
  low: 0.8, // Sharing sadness = high trust
  anxious: 0.7,
  guarded: 0.6,
  neutral: 0.3,
  calm: 0.5,
  high: 0.4,
  detached: 0.2, // Detachment = low trust
  lit: 0.5,
};

// Moving average
newTrustIndex = 0.8 * oldTrustIndex + 0.2 * vulnerabilityScore;
```

**Interpretation**:

- **0.0 - 0.3**: Low trust (user is guarded, detached)
- **0.4 - 0.6**: Moderate trust (neutral, mixed emotions)
- **0.7 - 1.0**: High trust (frequent vulnerability, openness)

---

### 2. Resonance Index (0-1)

**Definition**: Emotional convergence between user and Siani over time.

**Calculation**:

```typescript
// Cosine similarity between user's emotion vector and Siani's response emotion
resonance = cosineSimilarity(userEmotionVector, sianiEmotionVector);

// Update with exponential moving average
newResonanceIndex = 0.7 * oldResonanceIndex + 0.3 * resonance;
```

**Interpretation**:

- **High Resonance (0.7+)**: Siani's responses align well with user's emotional state
- **Medium Resonance (0.4-0.7)**: Moderate alignment
- **Low Resonance (0.0-0.4)**: Misalignment; may need to adjust tone

---

### 3. Continuity Score (0-1)

**Definition**: Topical and emotional overlap between sessions.

**Calculation**:

```typescript
// Jaccard similarity for topics
topicOverlap =
  intersection(currentTopics, previousTopics) /
  union(currentTopics, previousTopics);

// Cosine similarity for emotion vectors
emotionOverlap = cosineSimilarity(currentEmotionVector, previousEmotionMean);

// Weighted average
continuityScore = 0.6 * topicOverlap + 0.4 * emotionOverlap;
```

**Interpretation**:

- **High Continuity (0.7+)**: User returns to recurring themes and emotional patterns
- **Medium Continuity (0.4-0.7)**: Some overlap, but new topics emerging
- **Low Continuity (0.0-0.4)**: Distinct conversation, new context

---

## Emotional Similarity Search

### Cosine Similarity Calculation

```typescript
computeEmotionSimilarity(
  vectorA: number[], // [calm, guarded, lit]
  vectorB: number[]
): number {
  const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}
```

### Similarity Threshold

- **> 0.75**: High emotional similarity (retrieve this memory)
- **0.50 - 0.75**: Moderate similarity (may be relevant)
- **< 0.50**: Low similarity (exclude from context)

---

## Integration Points

### 1. Signal Engine Integration

**Use Case**: Trust Index influences signal scores.

```typescript
// In signalScore.service.ts
const trustBoost = relationalContext.trustIndex * 0.2; // 0-0.2 boost
const adjustedSignal = baseSignalScore + trustBoost;
```

**Effect**: High trust → positive signal reinforcement (user is engaging openly).

---

### 2. Avatar Layer Integration

**Use Case**: Recalled emotions modulate avatar glow color.

```typescript
// In avatar rendering
const recalledEmotion = context.emotionalContext.dominantEmotion;
const hue = emotionToHue(recalledEmotion); // guarded → 240°, calm → 180°, lit → 120°
avatar.setGlowColor(hue);
```

**Effect**: Visual continuity cue when Siani recalls past emotional states.

---

### 3. Resource Engine Integration

**Use Case**: Recurring topics trigger resource suggestions.

```typescript
// In resource recommendation
const topTopics = relationalContext.topics.slice(0, 5);
if (topTopics.includes("housing") && context.emotionalProfile.guarded > 0.6) {
  suggestResource("housing-assistance", "high-priority");
}
```

**Effect**: Proactive resource suggestions aligned with emotional patterns.

---

## Database Migration

### Run Prisma Migration

```bash
cd packages/backend
npx prisma migrate dev --name add_relational_memory
npx prisma generate
```

### Verify Schema

```bash
npx prisma studio
# Check for RelationalMemory and RelationalContext tables
```

---

## Testing

### 1. Store Conversation Memory

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

---

### 2. Retrieve Context

```bash
curl "http://localhost:3000/api/memory/relational/context/user-123?transcript=still+stressed&emotion=anxious&emotionVector=%5B0.2%2C0.7%2C0.1%5D&limit=5"
```

---

### 3. Get Metrics

```bash
curl http://localhost:3000/api/memory/relational/metrics/user-123
```

---

## Performance Considerations

### Vector Storage

- **Text embeddings**: 1536 dimensions (OpenAI)
- **Prosody embeddings**: 4 dimensions (pitch, energy, speechRate, variability)
- **Combined**: 1540 dimensions
- **Storage**: JSON strings in PostgreSQL (consider pgvector for production)

### Similarity Search Optimization

- **Current**: In-memory computation (acceptable for < 10k memories per user)
- **Future**: pgvector extension for PostgreSQL native similarity search
  ```sql
  SELECT * FROM relational_memories
  WHERE user_id = 'user-123'
  ORDER BY embedding <-> '[0.2, 0.7, 0.1, ...]'
  LIMIT 5;
  ```

---

## Future Enhancements

### 1. Temporal Smoothing

Implement emotion blending with temporal smoothing:

```typescript
const smoothedEmotion = 0.7 * currentEmotion + 0.3 * previousEmotion;
```

### 2. Emotion Trajectory Visualization

Track emotional progression over time:

```typescript
async analyzeEmotionTrajectory(userId: string, days: number): Promise<{
  timeline: { date: Date; calm: number; guarded: number; lit: number; }[];
  trend: "improving" | "stable" | "declining";
  volatility: number;
}>
```

### 3. Python Microservice Migration

Deploy emotion classification with ML models:

- Wav2Vec2 for audio embeddings
- sentence-transformers for text embeddings
- Continuous emotion vectors instead of discrete labels
- FastAPI service on Google Cloud Run

---

## Quick Reference

### Emotion Types

```typescript
type EmotionLevel =
  | "calm"
  | "guarded"
  | "lit"
  | "high"
  | "low"
  | "detached"
  | "neutral"
  | "anxious";
```

### Emotion Vector Format

```typescript
[calm, guarded, lit]; // Each 0-1, sum to 1.0
// Example: [0.3, 0.6, 0.1] → mostly guarded
```

### Relational Metrics

```typescript
interface RelationalMetrics {
  trustIndex: number; // 0-1: vulnerability frequency
  resonanceIndex: number; // 0-1: emotional alignment
  continuityScore: number; // 0-1: topical/emotional overlap
}
```

---

## Troubleshooting

### Compilation Errors

```bash
# Fix: Regenerate Prisma client
cd packages/backend
npx prisma generate

# Check for type errors
npm run type-check
```

### Missing Relational Context

- First conversation will create new RelationalContext with default scores (0.5)
- Subsequent conversations will update existing context

### Low Similarity Matches

- Check emotion vector normalization (should sum to 1.0)
- Verify cosine similarity threshold (default: 0.75)
- Increase limit parameter to retrieve more matches

---

## Summary

The Relational Memory System enables Siani to:
✅ **Remember** conversations with emotional context
✅ **Recall** similar past experiences based on emotional similarity
✅ **Track** relational depth through Trust, Resonance, and Continuity
✅ **Integrate** with Signal Engine, Avatar, and Resource systems
✅ **Visualize** emotional patterns over time (future)

**Next Steps**:

1. Run database migration: `npx prisma migrate dev`
2. Test API endpoints with sample conversations
3. Integrate retrieval into Siani's response generation
4. Monitor relational metrics in dashboard

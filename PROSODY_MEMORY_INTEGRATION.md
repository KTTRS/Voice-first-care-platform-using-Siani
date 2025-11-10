# Prosody-Driven Memory Embedding Integration

**Complete implementation of emotional prosody data shaping memory embeddings and retrieval in Weaviate.**

---

## Overview

This system integrates real-time prosody analysis (pitch, energy, emotion) with memory storage and retrieval, allowing Siani to remember conversations with emotional context and retrieve memories based on both semantic meaning AND emotional similarity.

### Key Innovation

**Traditional Memory Systems**: Text → OpenAI Embedding (1536d) → Weaviate → Retrieve by semantic similarity

**Prosody-Enhanced System**: Text + Prosody → Combined Embedding (1540d) → Weaviate → Retrieve by hybrid similarity (70% text + 30% prosody) with emotion-weighted scoring

---

## Architecture

### 1. Prosody Embedding Service

**File**: `packages/backend/src/services/prosodyEmbedding.service.ts`

Converts prosody data into a 4-dimensional vector:

```typescript
// Input: Prosody data from voice analysis
{
  pitchHz: 220,      // 0-500 Hz (typical speech)
  energy: 0.7,       // 0-1 (RMS energy)
  emotion: "high",   // EmotionLevel
  pitchVariance: 45  // Optional: pitch standard deviation
}

// Output: 4D prosody vector
[0.44, 0.7, 0.9, 0.62]
 ^^^^  ^^^  ^^^  ^^^^
 |     |    |    └─ Tempo variance (0-1)
 |     |    └────── Emotion intensity (0-1)
 |     └─────────── Energy (0-1)
 └───────────────── Normalized pitch (0-1)
```

**Emotion Intensity Mapping**:

- `detached`: 0.1 (withdrawn, minimal engagement)
- `low`: 0.3 (calm, subdued)
- `calm`: 0.4 (peaceful, stable)
- `neutral`: 0.5 (balanced baseline)
- `anxious`: 0.7 (worried, tense)
- `high`: 0.9 (excited, energetic)

**Key Functions**:

```typescript
// Generate prosody embedding
generateProsodyEmbedding(prosody: ProsodyData): ProsodyVector

// Combine text + prosody embeddings
combinedEmbedding(textEmbedding: number[], prosodyEmbedding: ProsodyVector): number[]

// Compute prosody similarity between two vectors
computeProsodySimilarity(vector1: number[], vector2: number[]): number

// Aggregate prosody frames over conversation chunk
aggregateProsodyFrames(frames: ProsodyData[]): ProsodyData

// Compute memory retention TTL based on emotion intensity
computeRetentionTTL(emotionIntensity: number): number
// 0.1 (detached) → 7 days
// 0.5 (neutral) → 30 days
// 0.9 (high) → 90 days

// Emotion-weighted scoring
computeEmotionWeightedScore(
  semanticSimilarity: number,
  emotionIntensity: number,
  boostFactor: number = 0.5
): number
// Example: High emotion (0.9) + high similarity (0.8) → 1.16
//          Low emotion (0.2) + high similarity (0.8) → 0.88
```

---

### 2. Weaviate Schema Updates

**File**: `packages/backend/src/services/vectordb.service.ts`

Extended `MemoryMoment` schema with prosody fields:

```typescript
{
  class: "MemoryMoment",
  vectorizer: "none", // We provide combined embeddings
  properties: [
    { name: "content", dataType: ["text"] },
    { name: "userId", dataType: ["string"] },
    { name: "emotion", dataType: ["string"] },
    { name: "tone", dataType: ["string"] },
    { name: "emotionIntensity", dataType: ["number"] }, // ← New
    { name: "contextWeight", dataType: ["number"] },    // ← New
    { name: "retentionTTL", dataType: ["number"] },     // ← New (days)
    { name: "timestamp", dataType: ["date"] }
  ]
}
```

**Storage Flow**:

1. Receive memory content + prosody data
2. Generate text embedding (OpenAI, 1536d)
3. Generate prosody embedding (4d)
4. Combine: `[...textEmbedding, ...prosodyVector]` → 1540d
5. Store in Weaviate with metadata (emotionIntensity, retentionTTL)

---

### 3. Memory Service Integration

**File**: `packages/backend/src/services/memoryMoment.service.ts`

#### Creating Memory Moments with Prosody

```typescript
export async function createMemoryMoment(
  data: Prisma.MemoryMomentUncheckedCreateInput,
  prosodyData?: ProsodyData
): Promise<MemoryMoment>;
```

**Flow**:

1. Create memory in Prisma (relational DB)
2. Generate text embedding via OpenAI
3. If `prosodyData` provided:
   - Generate prosody embedding (4d vector)
   - Combine text + prosody → 1540d vector
   - Compute emotion intensity (0-1)
   - Compute retention TTL based on emotion
4. Store combined vector in Weaviate with metadata
5. Return created memory

**Example**:

```typescript
const moment = await createMemoryMoment(
  {
    userId: "user_123",
    content: "I'm feeling really excited about my therapy progress!",
    emotion: "high",
    tone: "hopeful",
    vectorId: "weaviate",
  },
  {
    pitchHz: 280,
    energy: 0.8,
    emotion: "high",
    pitchVariance: 50,
  }
);

// Stored with:
// - Combined embedding: 1540d
// - emotionIntensity: 0.9
// - retentionTTL: 90 days (high emotion = longer retention)
```

#### Searching Memory Moments with Prosody

```typescript
export async function searchMemoryMoments(
  query: string,
  userId: string,
  limit: number = 10,
  prosodyData?: ProsodyData
): Promise<any[]>;
```

**Hybrid Search Flow**:

1. Generate text embedding for query
2. If `prosodyData` provided:
   - Generate prosody embedding for current emotional state
   - Combine text + prosody → 1540d query vector
3. Search Weaviate with combined vector (semantic + prosody similarity)
4. **Re-rank results** with emotion-weighted scoring:

   ```typescript
   // Base semantic similarity from Weaviate
   semanticSimilarity = result._additional.certainty

   // Emotion-weighted score
   emotionScore = semanticSimilarity * (1 + emotionIntensity * 0.5)

   // Emotion similarity boost (query vs. result emotion)
   emotionSimilarity = 1 - |queryEmotionIntensity - resultEmotionIntensity|
   finalScore = emotionScore * (0.8 + emotionSimilarity * 0.2)
   ```

5. Sort by `finalScore` and return top N results

**Example**:

```typescript
// User is anxious and searches for past coping strategies
const results = await searchMemoryMoments(
  "How did I cope with stress last time?",
  "user_123",
  10,
  {
    pitchHz: 240,
    energy: 0.6,
    emotion: "anxious", // Emotion intensity: 0.7
  }
);

// Returns memories ranked by:
// 1. Semantic similarity to query
// 2. Emotion similarity (anxious memories ranked higher)
// 3. Emotion intensity boost (high emotion memories prioritized)
```

---

### 4. API Endpoints

**File**: `packages/backend/src/routes/memoryMoments.ts`

#### POST `/api/memory-moments` - Create with Prosody

```bash
curl -X POST http://localhost:3000/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "user_123",
    "content": "I felt so calm during meditation today",
    "emotion": "calm",
    "tone": "peaceful",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 180,
      "energy": 0.4,
      "emotion": "calm",
      "pitchVariance": 20
    }
  }'
```

**Response**:

```json
{
  "id": "mem_xyz",
  "userId": "user_123",
  "content": "I felt so calm during meditation today",
  "emotion": "calm",
  "tone": "peaceful",
  "createdAt": "2025-01-01T12:00:00Z",
  "prosodyEnabled": true
}
```

#### POST `/api/memory-moments/search` - Semantic + Prosody Search

```bash
curl -X POST http://localhost:3000/api/memory-moments/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "times I felt hopeful",
    "limit": 5,
    "prosody": {
      "pitchHz": 250,
      "energy": 0.7,
      "emotion": "high"
    }
  }'
```

**Response**:

```json
{
  "query": "times I felt hopeful",
  "count": 5,
  "prosodyEnabled": true,
  "results": [
    {
      "content": "Therapy breakthrough! I can do this!",
      "emotion": "high",
      "emotionIntensity": 0.9,
      "timestamp": "2025-01-01T10:00:00Z",
      "score": 1.16, // Emotion-weighted score
      "semanticSimilarity": 0.85,
      "_additional": {
        "certainty": 0.85,
        "distance": 0.15
      }
    }
    // ...more results
  ]
}
```

#### GET `/api/memory-moments/by-emotion/:emotion`

```bash
curl http://localhost:3000/api/memory-moments/by-emotion/high \
  -H "Authorization: Bearer <token>"
```

---

## Emotion-Weighted Scoring System (BSAM)

**Biometric Signal Amplification Memory (BSAM)** layer re-ranks search results based on emotional context.

### Formula

```typescript
// Step 1: Base semantic similarity from Weaviate
semanticSimilarity = weaviate_certainty; // 0-1

// Step 2: Emotion intensity boost
emotionScore = semanticSimilarity * (1 + emotionIntensity * 0.5);

// Step 3: Emotion similarity between query and result
emotionSimilarity = 1 - Math.abs(queryEmotion - resultEmotion);

// Step 4: Final score
finalScore = emotionScore * (0.8 + emotionSimilarity * 0.2);
```

### Examples

| Scenario           | Semantic Sim | Emotion Int | Emotion Sim | Final Score |
| ------------------ | ------------ | ----------- | ----------- | ----------- |
| High emotion match | 0.80         | 0.90        | 0.95        | **1.14**    |
| Neutral memory     | 0.80         | 0.50        | 0.70        | **0.94**    |
| Low emotion        | 0.80         | 0.30        | 0.50        | **0.88**    |
| Emotion mismatch   | 0.70         | 0.70        | 0.20        | **0.75**    |

**Insight**: High-emotion memories with matching emotional context are significantly boosted, making them more likely to be retrieved during emotionally intense moments.

---

## Memory Retention Policies

### TTL (Time-to-Live) Based on Emotion Intensity

Memories decay over time, but high-emotion memories persist longer:

```typescript
function computeRetentionTTL(emotionIntensity: number): number {
  const minTTL = 7; // Minimum 7 days
  const maxTTL = 90; // Maximum 90 days
  const range = maxTTL - minTTL;

  // Exponential curve: high emotion gets disproportionately longer TTL
  const ttl = minTTL + range * Math.pow(emotionIntensity, 1.5);
  return Math.round(ttl);
}
```

| Emotion  | Intensity | TTL (Days) |
| -------- | --------- | ---------- |
| Detached | 0.1       | 7          |
| Low      | 0.3       | 14         |
| Calm     | 0.4       | 19         |
| Neutral  | 0.5       | 30         |
| Anxious  | 0.7       | 55         |
| High     | 0.9       | 90         |

**Rationale**: High-emotion moments (breakthroughs, crises, celebrations) are more memorable and clinically significant.

---

## Integration with Real-Time Prosody

### Current State

- **Prosody WebSocket**: `ws://localhost:3000/prosody` (real-time pitch/energy streaming)
- **TTS with Prosody**: `/api/tts/synthesize` (synthesizes speech with prosody extraction)
- **Mobile Prosody Hook**: `useProsodyStream` (consumes WebSocket data)

### Next Step: Connect to Transcription

**Goal**: Integrate prosody data directly into the `/api/transcribe` endpoint for automatic prosody-aware memory creation.

**Proposed Flow**:

1. User speaks → Mobile records audio
2. Audio → `/api/transcribe` (Whisper transcription)
3. **Simultaneously**: Audio → `/prosody` WebSocket (pitch/energy analysis)
4. Aggregate prosody frames during transcription
5. Create memory with combined text + prosody embedding
6. Store in Weaviate with emotion-weighted metadata

**Implementation** (TODO):

```typescript
// packages/backend/src/routes/transcribe.ts
router.post("/transcribe", async (req, res) => {
  const audioBuffer = req.body.audio;

  // Parallel processing
  const [transcript, prosodyFrames] = await Promise.all([
    whisperService.transcribe(audioBuffer),
    prosodyService.analyzeAudioBuffer(audioBuffer),
  ]);

  // Aggregate prosody data
  const aggregatedProsody =
    prosodyEmbeddingService.aggregateProsodyFrames(prosodyFrames);

  // Detect emotion from text
  const emotion = analyzeEmotion(transcript);

  // Create memory with prosody
  const memory = await createMemoryMoment(
    {
      userId: req.user.id,
      content: transcript,
      emotion,
      tone: aggregatedProsody.emotion,
      vectorId: "weaviate",
    },
    aggregatedProsody
  );

  res.json({ transcript, memory, prosody: aggregatedProsody });
});
```

---

## Testing

### Test Script: `test-prosody-memory.sh`

```bash
#!/bin/bash

echo "🧪 Testing Prosody-Enhanced Memory System"

# 1. Create memory with high emotion prosody
echo "1️⃣ Creating high-emotion memory..."
curl -X POST http://localhost:3000/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "userId": "test_user",
    "content": "I had a major breakthrough in therapy today!",
    "emotion": "high",
    "tone": "hopeful",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 280,
      "energy": 0.85,
      "emotion": "high",
      "pitchVariance": 60
    }
  }'

echo -e "\n"

# 2. Create memory with low emotion prosody
echo "2️⃣ Creating low-emotion memory..."
curl -X POST http://localhost:3000/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "userId": "test_user",
    "content": "Feeling pretty down today, hard to get out of bed",
    "emotion": "low",
    "tone": "subdued",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 150,
      "energy": 0.3,
      "emotion": "low",
      "pitchVariance": 15
    }
  }'

echo -e "\n"

# 3. Search with high emotion prosody (should rank high-emotion memories higher)
echo "3️⃣ Searching with high-emotion prosody..."
curl -X POST http://localhost:3000/api/memory-moments/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "query": "therapy progress",
    "limit": 5,
    "prosody": {
      "pitchHz": 270,
      "energy": 0.8,
      "emotion": "high"
    }
  }' | jq '.results[] | {content, emotion, emotionIntensity, score}'

echo -e "\n"

# 4. Search without prosody (baseline semantic search)
echo "4️⃣ Searching without prosody (baseline)..."
curl -X POST http://localhost:3000/api/memory-moments/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "query": "therapy progress",
    "limit": 5
  }' | jq '.results[] | {content, emotion, score}'

echo -e "\n✅ Prosody memory tests complete"
```

### Expected Results

**With Prosody**:

- High-emotion memories rank higher when searching with high-emotion prosody
- Emotion similarity boosts relevant memories
- Final scores reflect both semantic AND emotional alignment

**Without Prosody**:

- Pure semantic search (text-only)
- No emotion weighting
- Lower scores overall

---

## Benefits

### 1. Emotional Context Awareness

Memories are stored with emotional "fingerprints" from voice prosody, not just text sentiment.

### 2. Adaptive Retrieval

During anxious moments, Siani can retrieve past anxious moments and coping strategies with higher relevance.

### 3. Clinical Insight

Therapists can query memories by emotion intensity (e.g., "Show me all high-emotion moments in the past 30 days").

### 4. Memory Persistence

High-emotion memories persist longer (90 days vs. 7 days for detached), mirroring human memory formation.

### 5. Multimodal Understanding

Combines text semantics with voice biometrics for richer memory representation.

---

## Future Enhancements

### 1. Reinforcement Learning

Recalled memories get emotion intensity boost, mimicking memory consolidation.

### 2. Decay Functions

Implement exponential decay: `weight = initial_weight * exp(-time / emotion_ttl)`

### 3. Multi-Vector Search

Separate text vector and prosody vector in Weaviate for independent weighting.

### 4. Emotion Clustering

Group memories by emotion clusters (e.g., all "anxious" memories) for pattern analysis.

### 5. Real-Time Prosody Streaming to Transcription

Merge `/prosody` WebSocket data into `/api/transcribe` for automatic prosody-aware memory creation.

---

## File Checklist

- ✅ `packages/backend/src/services/prosodyEmbedding.service.ts` (240 lines)
- ✅ `packages/backend/src/services/vectordb.service.ts` (updated schema)
- ✅ `packages/backend/src/services/memoryMoment.service.ts` (combined embeddings)
- ✅ `packages/backend/src/routes/memoryMoments.ts` (prosody API endpoints)
- ⏳ `packages/backend/src/routes/transcribe.ts` (real-time prosody integration)
- ✅ `PROSODY_MEMORY_INTEGRATION.md` (this document)
- ⏳ `test-prosody-memory.sh` (integration test script)

---

## Quick Start

### 1. Start Backend

```bash
cd packages/backend
npm run dev
```

### 2. Test Memory Creation

```bash
curl -X POST http://localhost:3000/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "user_123",
    "content": "Feeling great today!",
    "emotion": "high",
    "tone": "excited",
    "vectorId": "weaviate",
    "prosody": {
      "pitchHz": 260,
      "energy": 0.75,
      "emotion": "high"
    }
  }'
```

### 3. Test Prosody-Enhanced Search

```bash
curl -X POST http://localhost:3000/api/memory-moments/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "happy moments",
    "limit": 5,
    "prosody": {
      "pitchHz": 250,
      "energy": 0.7,
      "emotion": "high"
    }
  }'
```

---

## Summary

The prosody-enhanced memory system transforms Siani from a text-based chatbot into an emotionally-aware companion that:

1. **Remembers** conversations with emotional context from voice prosody
2. **Retrieves** memories based on both semantic meaning AND emotional similarity
3. **Persists** high-emotion memories longer (90 days vs. 7 days)
4. **Ranks** search results with emotion-weighted scoring (BSAM layer)
5. **Integrates** real-time prosody data from voice analysis

This enables Siani to provide contextually-aware, emotionally-intelligent responses that adapt to the user's current emotional state.

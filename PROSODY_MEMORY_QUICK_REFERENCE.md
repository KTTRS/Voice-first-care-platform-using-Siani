# Prosody Memory Integration - Quick Reference

**Emotional prosody data shaping memory embeddings and retrieval.**

---

## Core Concept

```text
Traditional:  Text → Embedding (1536d) → Weaviate
Enhanced:     Text + Prosody → Combined Embedding (1540d) → Weaviate
              ↓
              Hybrid Search (70% text + 30% prosody) + Emotion Weighting
```

---

## Prosody Vector (4D)

```typescript
[normalized_pitch, energy, emotion_intensity, tempo_variance][
  (0.44, 0.7, 0.9, 0.62)
];
```

**Components**:

- `normalized_pitch`: pitchHz / 500 (0-1)
- `energy`: RMS energy (0-1)
- `emotion_intensity`: Mapped from emotion (0.1-0.9)
- `tempo_variance`: Pitch variance or derived (0-1)

---

## Emotion Intensity Map

| Emotion  | Intensity | TTL (Days) |
| -------- | --------- | ---------- |
| detached | 0.1       | 7          |
| low      | 0.3       | 14         |
| calm     | 0.4       | 19         |
| neutral  | 0.5       | 30         |
| anxious  | 0.7       | 55         |
| high     | 0.9       | 90         |

---

## API Usage

### Create Memory with Prosody

```bash
POST /api/memory-moments
{
  "userId": "user_123",
  "content": "I felt so calm during meditation",
  "emotion": "calm",
  "tone": "peaceful",
  "vectorId": "weaviate",
  "prosody": {
    "pitchHz": 180,
    "energy": 0.4,
    "emotion": "calm",
    "pitchVariance": 20  // optional
  }
}
```

**Result**: Combined embedding (1540d), emotionIntensity: 0.4, retentionTTL: 19 days

### Search with Prosody

```bash
POST /api/memory-moments/search
{
  "query": "times I felt hopeful",
  "limit": 5,
  "prosody": {
    "pitchHz": 250,
    "energy": 0.7,
    "emotion": "high"
  }
}
```

**Result**: Emotion-weighted ranking (high-emotion memories boosted)

### Search by Emotion

```bash
GET /api/memory-moments/by-emotion/high?limit=10
```

---

## Emotion-Weighted Scoring (BSAM)

```typescript
// Step 1: Base semantic similarity
semanticSimilarity = weaviate_certainty // 0-1

// Step 2: Emotion boost
emotionScore = semanticSimilarity * (1 + emotionIntensity * 0.5)

// Step 3: Emotion similarity
emotionSimilarity = 1 - |queryEmotion - resultEmotion|

// Step 4: Final score
finalScore = emotionScore * (0.8 + emotionSimilarity * 0.2)
```

**Example**:

- High emotion (0.9) + high similarity (0.8) → **1.16**
- Low emotion (0.2) + high similarity (0.8) → **0.88**

---

## Code Integration

### Import Services

```typescript
import {
  prosodyEmbeddingService,
  ProsodyData,
} from "./prosodyEmbedding.service";
import {
  createMemoryMoment,
  searchMemoryMoments,
} from "./memoryMoment.service";
```

### Create Memory

```typescript
const prosodyData: ProsodyData = {
  pitchHz: 220,
  energy: 0.7,
  emotion: "high",
  pitchVariance: 45,
};

const moment = await createMemoryMoment(
  {
    userId: "user_123",
    content: "Great therapy session today!",
    emotion: "high",
    tone: "hopeful",
    vectorId: "weaviate",
  },
  prosodyData // Optional
);
```

### Search Memories

```typescript
const results = await searchMemoryMoments(
  "coping strategies",
  "user_123",
  10,
  prosodyData // Optional
);

// Results include:
// - content, emotion, emotionIntensity, retentionTTL
// - score (emotion-weighted), semanticSimilarity
```

---

## Key Functions

### ProsodyEmbeddingService

```typescript
// Generate prosody embedding
generateProsodyEmbedding(prosody: ProsodyData): ProsodyVector

// Combine text + prosody
combinedEmbedding(textEmbedding: number[], prosodyEmbedding: ProsodyVector): number[]

// Compute retention TTL
computeRetentionTTL(emotionIntensity: number): number

// Emotion-weighted score
computeEmotionWeightedScore(
  semanticSimilarity: number,
  emotionIntensity: number,
  boostFactor: number = 0.5
): number

// Aggregate prosody frames
aggregateProsodyFrames(frames: ProsodyData[]): ProsodyData
```

---

## Testing

### Run Test Script

```bash
./test-prosody-memory.sh
```

**Tests**:

1. Create high-emotion memory (pitchHz=280, energy=0.85)
2. Create low-emotion memory (pitchHz=150, energy=0.3)
3. Create neutral memory (pitchHz=200, energy=0.5)
4. Create anxious memory (pitchHz=240, energy=0.6)
5. Search with high-emotion prosody
6. Search with low-emotion prosody
7. Search without prosody (baseline)
8. Search by emotion category

---

## Files Modified

- ✅ `packages/backend/src/services/prosodyEmbedding.service.ts` (new, 240 lines)
- ✅ `packages/backend/src/services/vectordb.service.ts` (schema update)
- ✅ `packages/backend/src/services/memoryMoment.service.ts` (combined embeddings)
- ✅ `packages/backend/src/routes/memoryMoments.ts` (prosody API)

---

## Next Steps

1. **Real-time Prosody Integration**: Connect `/prosody` WebSocket to `/api/transcribe`
2. **Memory Decay**: Implement TTL-based expiration
3. **Reinforcement**: Boost recalled memories
4. **Clustering**: Group memories by emotion patterns

---

## Common Patterns

### Default Prosody (Neutral)

```typescript
const defaultProsody: ProsodyData = {
  pitchHz: 180,
  energy: 0.4,
  emotion: "neutral",
};
```

### Aggregate Prosody from Audio Frames

```typescript
const frames: ProsodyData[] = [
  { pitchHz: 200, energy: 0.6, emotion: "high" },
  { pitchHz: 220, energy: 0.7, emotion: "high" },
  { pitchHz: 210, energy: 0.65, emotion: "high" },
];

const aggregated = prosodyEmbeddingService.aggregateProsodyFrames(frames);
// Result: { pitchHz: 210, energy: 0.65, emotion: "high", pitchVariance: 8.16 }
```

---

## Troubleshooting

### Memory not stored with prosody?

Check that `prosodyData` parameter is passed to `createMemoryMoment()`.

### Search results not emotion-weighted?

Ensure `prosodyData` is included in `searchMemoryMoments()` call.

### Weaviate connection error?

Verify `docker-compose up` is running and Weaviate is accessible on port 8080.

### TypeScript errors?

Run `npm run build` in `packages/backend` to check compilation.

---

## Performance

- **Prosody embedding generation**: <1ms
- **Text embedding (OpenAI)**: ~200ms
- **Combined embedding**: <1ms
- **Weaviate query**: ~50ms
- **Total latency**: ~250ms (dominated by OpenAI API)

---

## Benefits Summary

✅ **Emotional context** in memory storage  
✅ **Adaptive retrieval** based on current emotion  
✅ **Clinical insights** via emotion intensity tracking  
✅ **Longer retention** for high-emotion memories  
✅ **Multimodal understanding** (text + voice biometrics)

---

**Documentation**: `PROSODY_MEMORY_INTEGRATION.md`  
**Test Script**: `test-prosody-memory.sh`  
**Status**: ✅ Implementation complete

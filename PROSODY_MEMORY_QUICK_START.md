# Prosody Memory Integration - Quick Reference

## Quick Start

### 1. Transcribe with Prosody Memory Creation

```bash
# Upload audio and automatically create prosody-enhanced memory
curl -X POST http://localhost:3000/api/voice/transcribe \
  -H "Authorization: Bearer <token>" \
  -F "audio=@recording.m4a" \
  -F "createMemory=true"
```

**Response:**
```json
{
  "text": "I feel amazing about my progress!",
  "prosody": {
    "pitchHz": 260,
    "energy": 0.75,
    "emotion": "high",
    "pitchVariance": 50
  },
  "emotion": "high",
  "memoryMomentId": "mem_xyz123",
  "prosodyEnabled": true
}
```

### 2. Search Memories with Emotional Context

```bash
# Search with current emotional state
curl -X POST http://localhost:3000/api/memory-moments/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
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

### 3. Check Memory Lifecycle Stats

```bash
# Get statistics on memory age and decay status
curl http://localhost:3000/api/memory-moments/lifecycle/stats \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "total": 150,
  "byEmotion": {
    "high": 30,
    "neutral": 80,
    "low": 20,
    "anxious": 20
  },
  "avgAgeDays": 15.5,
  "expiredCount": 10,
  "nearExpiryCount": 8
}
```

## API Endpoints

### Voice Transcription

**POST `/api/voice/transcribe`**
- Upload audio file
- Extracts prosody automatically
- Creates memory moment if `createMemory=true`
- Returns: transcription + prosody + memoryId

**Parameters:**
- `audio` (file, required): Audio file (m4a, mp3, wav, webm, ogg)
- `createMemory` (boolean, optional): Create memory moment (default: true)

### Memory Search

**POST `/api/memory-moments/search`**
- Semantic search with optional prosody weighting
- Automatically reinforces recalled memories

**Body:**
```json
{
  "query": "search text",
  "limit": 10,
  "prosody": {
    "pitchHz": 200,
    "energy": 0.5,
    "emotion": "neutral",
    "pitchVariance": 30
  }
}
```

### Memory Creation

**POST `/api/memory-moments`**
- Create memory with optional prosody data

**Body:**
```json
{
  "userId": "user_123",
  "content": "Memory text",
  "emotion": "high",
  "tone": "hopeful",
  "vectorId": "weaviate",
  "prosody": {
    "pitchHz": 260,
    "energy": 0.75,
    "emotion": "high",
    "pitchVariance": 50
  }
}
```

### Lifecycle Management

**GET `/api/memory-moments/lifecycle/stats`**
- Get memory statistics

**POST `/api/memory-moments/lifecycle/decay`**
- Apply memory decay
- Body: `{ "dryRun": true/false }`

**POST `/api/memory-moments/lifecycle/cleanup`**
- Delete expired memories
- Body: `{ "dryRun": true/false, "gracePeriodMultiplier": 2.0 }`

## Emotion Levels

```typescript
type EmotionLevel = 
  | "detached"  // 0.1 intensity, 7 days TTL
  | "low"       // 0.3 intensity, 14 days TTL
  | "calm"      // 0.4 intensity, 19 days TTL
  | "neutral"   // 0.5 intensity, 30 days TTL
  | "anxious"   // 0.7 intensity, 55 days TTL
  | "high"      // 0.9 intensity, 90 days TTL
```

## Prosody Data Structure

```typescript
interface ProsodyData {
  pitchHz: number;        // 0-500 Hz (typical speech)
  energy: number;         // 0-1 (RMS energy)
  emotion: EmotionLevel;  // Emotion category
  pitchVariance?: number; // Optional: pitch std dev
}
```

## Memory Retention TTL

| Emotion  | Intensity | TTL (Days) |
|----------|-----------|------------|
| Detached | 0.1       | 7          |
| Low      | 0.3       | 14         |
| Calm     | 0.4       | 19         |
| Neutral  | 0.5       | 30         |
| Anxious  | 0.7       | 55         |
| High     | 0.9       | 90         |

**Formula:** `TTL = 7 + (90 - 7) * emotionIntensity^1.5`

## Memory Reinforcement

When memories are recalled in searches:
- **1st result:** +0.05 intensity → ~+10 days TTL
- **2nd result:** +0.03 intensity → ~+6 days TTL
- **3rd result:** +0.01 intensity → ~+2 days TTL

## Code Examples

### TypeScript Usage

```typescript
import { createMemoryMoment } from './services/memoryMoment.service';
import { analyzeAudioFile } from './services/prosody.service';
import { analyzeEmotion } from './utils/emotionAnalysis';

// Transcribe and create memory with prosody
async function transcribeAndStore(audioPath: string, userId: string) {
  // Analyze audio for prosody
  const prosodyData = await analyzeAudioFile(audioPath);
  
  // Get transcription
  const transcription = await transcribeAudio(audioPath);
  
  // Detect emotion
  const emotion = analyzeEmotion(transcription.text);
  
  // Create memory with prosody
  const memory = await createMemoryMoment(
    {
      userId,
      content: transcription.text,
      emotion,
      tone: emotion,
      vectorId: 'weaviate',
    },
    {
      ...prosodyData,
      emotion: emotion as EmotionLevel,
    }
  );
  
  return memory;
}
```

### Search with Current Emotion

```typescript
import { searchMemoryMoments } from './services/memoryMoment.service';

async function searchByCurrentMood(query: string, userId: string) {
  // Get user's current emotional state
  const currentProsody = {
    pitchHz: 240,
    energy: 0.6,
    emotion: 'anxious' as EmotionLevel,
  };
  
  // Search with emotional context
  const results = await searchMemoryMoments(
    query,
    userId,
    10,
    currentProsody,
    true // Enable reinforcement
  );
  
  return results;
}
```

### Lifecycle Management

```typescript
import {
  applyMemoryDecay,
  cleanupExpiredMemories,
  getMemoryLifecycleStats,
} from './services/memoryLifecycle.service';

// Scheduled job: daily decay
async function dailyMemoryMaintenance() {
  // Get stats before
  const statsBefore = await getMemoryLifecycleStats();
  console.log(`Before: ${statsBefore.expiredCount} expired memories`);
  
  // Apply decay
  const decayedCount = await applyMemoryDecay(false);
  console.log(`Decayed ${decayedCount} memories`);
  
  // Get stats after
  const statsAfter = await getMemoryLifecycleStats();
  console.log(`After: ${statsAfter.expiredCount} expired memories`);
}

// Weekly cleanup
async function weeklyMemoryCleanup() {
  const deletedCount = await cleanupExpiredMemories(
    2.0, // Grace period: 2x TTL
    false // Not a dry run
  );
  
  console.log(`Deleted ${deletedCount} expired memories`);
}
```

## Testing

### Run Integration Tests

```bash
# Make script executable
chmod +x test-prosody-memory-integration.sh

# Run tests
./test-prosody-memory-integration.sh
```

### Manual Testing

```bash
# 1. Create test memories
curl -X POST http://localhost:3000/api/memory-moments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "test_user",
    "content": "Breakthrough in therapy!",
    "emotion": "high",
    "tone": "hopeful",
    "vectorId": "weaviate",
    "prosody": { "pitchHz": 280, "energy": 0.85, "emotion": "high" }
  }'

# 2. Search with prosody
curl -X POST http://localhost:3000/api/memory-moments/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "therapy",
    "prosody": { "pitchHz": 270, "energy": 0.8, "emotion": "high" }
  }'

# 3. Check lifecycle stats
curl http://localhost:3000/api/memory-moments/lifecycle/stats \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### Memory Not Created
- Check if `createMemory=true` in request
- Verify userId is provided
- Check Weaviate connection
- Review server logs for embedding errors

### Search Returns No Results
- Verify memories exist in vector DB
- Check if query embedding was generated
- Try search without prosody first
- Review emotion-weighted scoring logs

### Reinforcement Not Working
- Ensure `reinforceResults=true` in search
- Check if memory IDs are valid
- Review logs for reinforcement errors

## Environment Variables

```bash
# Transcription
TRANSCRIPTION_STRATEGY=openai  # or "local" or "hybrid"
OPENAI_API_KEY=sk-...
DELETE_AUDIO_AFTER_TRANSCRIPTION=true

# Weaviate
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=...

# Memory Lifecycle (optional)
MEMORY_DECAY_SCHEDULE=0 3 * * *  # Daily at 3 AM
MEMORY_CLEANUP_SCHEDULE=0 4 * * 0  # Weekly on Sunday
```

## Performance Tips

1. **Batch Processing**: Process multiple audio files in parallel
2. **Caching**: Cache prosody embeddings for frequently accessed memories
3. **Indexing**: Ensure Weaviate indexes are optimized
4. **Cleanup**: Run periodic cleanup to manage storage
5. **Monitoring**: Track memory lifecycle stats regularly

## Best Practices

1. **Always use prosody data** for voice-based interactions
2. **Enable reinforcement** in production searches
3. **Run decay daily** and cleanup weekly
4. **Monitor TTL distribution** to understand memory patterns
5. **Test with real audio** for accurate prosody extraction
6. **Use dry runs first** before applying decay/cleanup

## Further Reading

- See `PROSODY_MEMORY_COMPLETE_IMPLEMENTATION.md` for detailed documentation
- See `PROSODY_MEMORY_INTEGRATION.md` for architecture overview
- See `PROSODY_MEMORY_IMPLEMENTATION_SUMMARY.md` for implementation history

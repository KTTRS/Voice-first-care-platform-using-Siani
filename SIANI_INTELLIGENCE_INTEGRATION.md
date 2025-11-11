# Siani Intelligence Integration Guide

## 🎯 Overview

This integration connects **all** intelligence layers into a unified pipeline:

1. **Relational Memory** → Emotional context + trust tracking
2. **Signal Engine** → Trust delta + emotion intensity updates
3. **Memory Service** → Storage with tone + emotion + prosody
4. **TTS/Prosody** → Dynamic tone selection based on user state

**Result**: Siani responds with full emotional awareness, remembers relational context, and adapts her voice prosody in real-time.

---

## 🏗️ Architecture

```
Voice Input (User)
      ↓
┌─────────────────────────────────────────────┐
│  Siani Intelligence Service                 │
│  (sianiIntelligence.service.ts)             │
└─────────────────────────────────────────────┘
      ↓
   ┌──┴──┬──────┬──────┬──────┐
   ↓     ↓      ↓      ↓      ↓
┌──────┐ │   ┌──────┐ │   ┌──────┐
│Emotion│ │   │Memory│ │   │Signal│
│Class. │ │   │Service│ │  │Engine│
└──────┘ │   └──────┘ │   └──────┘
         ↓            ↓
   ┌──────────┐ ┌──────────┐
   │Relational│ │TTS/      │
   │Memory    │ │Prosody   │
   └──────────┘ └──────────┘
         ↓
   Response (Siani)
   - Text with context
   - Emotion-aware tone
   - Dynamic prosody
```

---

## 📡 API Endpoint

### POST `/api/siani/interact`

Process a complete voice interaction through the full intelligence pipeline.

**Request:**

```json
{
  "userId": "user-123",
  "transcript": "I've been feeling really anxious about work",
  "prosodyData": {
    "pitchHz": 220,
    "energy": 0.65,
    "emotion": "anxious",
    "pitchVariance": 45
  },
  "detectedEmotion": "anxious"
}
```

**Response:**

```json
{
  "success": true,
  "response": {
    "text": "I can sense that tension. Take a breath with me. This reminds me of when you shared similar feelings before. What feels most important to focus on right now?",
    "emotion": "calm",
    "emotionVector": [0.2, 0.7, 0.1],
    "tone": "gentle",
    "prosodyConfig": {
      "pitch": -2,
      "speakingRate": 0.9,
      "volumeGain": -2
    },
    "relationalContext": {
      "trustLevel": 0.78,
      "familiarity": 0.82,
      "continuity": 0.65
    },
    "contextualMemories": [
      {
        "id": "mem_xyz",
        "content": "Last week we talked about work stress",
        "emotionSimilarity": 0.92
      }
    ]
  }
}
```

---

## 🔗 Integration Flow

### 1. Emotion Classification

```typescript
// From prosody or text inference
const emotion = detectedEmotion || inferEmotionFromProsody(prosodyData);
const emotionVector = mapEmotionToVector(emotion);
// → [calm, guarded, lit] vector
```

### 2. Relational Context Retrieval

```typescript
// Retrieve similar past conversations
const context = await relationalMemoryService.retrieveContext(
  userId,
  transcript,
  emotion,
  emotionVector,
  5 // top 5 similar memories
);
// → Returns trust level, continuity, similar memories
```

### 3. Memory Storage

```typescript
// Store with tone + emotion + prosody
await relationalMemoryService.storeConversation(
  userId,
  transcript,
  emotion,
  emotionVector,
  topics,
  prosodyData
);

// Also store in MemoryMoment for Signal Engine
await createMemoryMoment(
  {
    userId,
    content: transcript,
    emotion,
    tone: selectedTone,
    metadata: { emotionVector, trustLevel, topics },
  },
  prosodyData
);
```

### 4. Signal Engine Update

```typescript
// Calculate trust delta
const vulnerabilityBoost = getVulnerabilityBoost(emotion); // 0.2-0.8
const trustDelta = vulnerabilityBoost * 0.1; // Max +0.1 per interaction

// Update system trust score
const updatedSystemTrust = currentScore.systemTrust - trustDelta * 10;

// Update mental health risk based on emotion intensity
const emotionRisk = calculateEmotionRisk(emotion);
const updatedMentalHealth =
  currentScore.mentalHealthRisk * 0.7 + emotionRisk * 0.3;
```

**Emotion → Risk Mapping:**

- `low`: 8/10 (high risk)
- `detached`: 7/10
- `anxious`: 6/10
- `guarded`: 5/10
- `neutral`: 4/10
- `calm`: 2/10
- `lit`: 2/10 (low risk)

### 5. Dynamic Prosody Selection

```typescript
// Select TTS prosody based on user's emotion + trust level
const prosodyConfig = selectProsodyConfig(
  userEmotion,
  relationalCues,
  emotionalContext
);

// Example outputs:
// User anxious + high trust → pitch: -2, rate: 0.9, gain: -2 (calm, slower)
// User lit + high trust → pitch: +2, rate: 1.1, gain: +1 (energetic)
// User low + low trust → pitch: +1, rate: 0.95, gain: 0 (gentle, warm)
```

### 6. Contextual Response Generation

```typescript
// Use relational memory to inform response
const response = generateContextualResponse(transcript, emotion, context);

// Example logic:
if (trustLevel > 0.7 && continuity > 0.6) {
  response += "I remember we've talked about this before. ";
}

if (emotion === "anxious") {
  response += "I can sense that tension. Take a breath with me. ";
}

if (contextualMemories.length > 0) {
  response += "This reminds me of when you shared similar feelings before. ";
}
```

---

## 🎨 Tone Selection Matrix

| User Emotion | Trust Level | Selected Tone | Prosody Adjustments |
| ------------ | ----------- | ------------- | ------------------- |
| `anxious`    | High        | `gentle`      | Pitch -2, Rate 0.9  |
| `anxious`    | Low         | `gentle`      | Pitch -2, Rate 0.9  |
| `guarded`    | High        | `supportive`  | Pitch -1, Rate 0.95 |
| `guarded`    | Low         | `gentle`      | Pitch -2, Rate 0.9  |
| `low`        | High        | `empathetic`  | Pitch +1, Rate 0.95 |
| `low`        | Low         | `empathetic`  | Pitch +1, Rate 0.95 |
| `calm`       | High        | `warm`        | Pitch 0, Rate 1.0   |
| `calm`       | Low         | `supportive`  | Pitch 0, Rate 1.0   |
| `lit`        | High        | `energetic`   | Pitch +2, Rate 1.1  |
| `lit`        | Low         | `supportive`  | Pitch +1, Rate 1.05 |

**Trust Adjustments:**

- **High trust (>0.7)**: More expressive (+5% rate, +1dB gain)
- **Low trust (<0.4)**: More measured (-5% rate, -1dB gain)

---

## 💾 Database Schema Integration

### MemoryMoment (Enhanced)

```typescript
{
  userId: string;
  content: string;
  emotion: EmotionLevel;      // NEW: From emotion classification
  tone: string;                // NEW: warm/gentle/energetic/supportive/empathetic
  metadata: {
    emotionVector: [0.2, 0.7, 0.1];  // NEW: 3D emotion vector
    topics: ["work", "stress"];       // NEW: Extracted topics
    trustLevel: 0.78;                  // NEW: From relational context
    resonance: 0.82;                   // NEW: From relational context
    prosodyData: {                     // Existing
      pitchHz: 220,
      energy: 0.65,
      emotion: "anxious"
    }
  }
}
```

### SignalScore (Enhanced)

```typescript
{
  systemTrust: number; // Updated by trust delta
  mentalHealthRisk: number; // Updated by emotion intensity
  // Implicit trust_delta tracked through systemTrust changes
  // Implicit emotion_intensity tracked through mentalHealthRisk
}
```

### RelationalMemory

```typescript
{
  userId: string;
  content: string;
  emotionVector: string; // JSON: [calm, guarded, lit]
  topics: string; // JSON: ["work", "stress"]
  embedding: string; // Combined text + prosody embedding
}
```

---

## 📊 Signal Engine Trust Delta Formula

```typescript
// 1. Get vulnerability score from emotion
const vulnerabilityBoost = {
  low: 0.8, // High vulnerability = high trust boost
  anxious: 0.7,
  guarded: 0.6,
  neutral: 0.3,
  calm: 0.5,
  high: 0.4,
  detached: 0.2,
  lit: 0.5,
}[emotion];

// 2. Calculate trust delta
const trustDelta = vulnerabilityBoost * 0.1; // 0.02 to 0.08 per interaction

// 3. Update system trust (inverted: higher trust = lower risk)
const newSystemTrust = Math.max(
  0,
  Math.min(10, currentScore.systemTrust - trustDelta * 10)
);

// Example trajectory:
// Initial: systemTrust = 5.0 (neutral)
// User shares "anxious" moment: trustDelta = 0.07 → systemTrust = 4.3
// User shares "low" moment: trustDelta = 0.08 → systemTrust = 3.5
// After 10 vulnerable moments: systemTrust → 0-1 (high trust achieved)
```

---

## 🎤 TTS Integration Example

### Before Integration:

```typescript
// Static TTS config
const response = await ttsClient.synthesize({
  text: "How are you feeling?",
  voice: { languageCode: "en-US", name: "en-US-Standard-A" },
  pitch: 0,
  speakingRate: 1.0,
});
```

### After Integration:

```typescript
// Dynamic prosody from Siani Intelligence
const sianiResponse = await sianiIntelligenceService.processVoiceInteraction({
  userId,
  transcript: userInput,
  prosodyData,
});

const response = await ttsClient.synthesize({
  text: sianiResponse.text,
  voice: { languageCode: "en-US", name: "en-US-Standard-A" },
  pitch: sianiResponse.prosodyConfig.pitch, // -2 (calming for anxious user)
  speakingRate: sianiResponse.prosodyConfig.speakingRate, // 0.9 (slower)
  volumeGain: sianiResponse.prosodyConfig.volumeGain, // -2 (softer)
});
```

---

## 🧪 Testing

### Test 1: Anxious User, Low Trust

```bash
curl -X POST http://localhost:3000/api/siani/interact \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "transcript": "Im so worried about everything",
    "prosodyData": {
      "pitchHz": 240,
      "energy": 0.7,
      "emotion": "anxious"
    }
  }'
```

**Expected:**

- Emotion: `anxious`
- Tone: `gentle`
- Prosody: `pitch: -2, rate: 0.9, gain: -2`
- Trust delta: `+0.07`
- Signal: `systemTrust ↓, mentalHealthRisk ↑`

### Test 2: Lit User, High Trust

```bash
curl -X POST http://localhost:3000/api/siani/interact \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-456",
    "transcript": "I just got amazing news and Im so excited!",
    "prosodyData": {
      "pitchHz": 280,
      "energy": 0.9,
      "emotion": "lit"
    }
  }'
```

**Expected:**

- Emotion: `lit`
- Tone: `energetic`
- Prosody: `pitch: +2, rate: 1.1, gain: +1`
- Trust delta: `+0.05`
- Signal: `mentalHealthRisk ↓`

---

## 📈 Metrics Dashboard

Get relational context for UI display:

```bash
curl http://localhost:3000/api/siani/context/user-123
```

**Response:**

```json
{
  "success": true,
  "context": {
    "trustIndex": 0.78,
    "resonanceIndex": 0.62,
    "continuityScore": 0.71,
    "conversationCount": 24,
    "emotionalProfile": {
      "calm": 0.35,
      "guarded": 0.5,
      "lit": 0.15
    },
    "topics": ["work", "stress", "family", "sleep"]
  }
}
```

---

## 🔮 Future Enhancements

### 1. Avatar Glow Color Modulation

```typescript
// In avatar rendering (mobile/web)
const recalledEmotion = sianiResponse.contextualMemories[0]?.emotion;
const hue = {
  calm: 180,    // Blue-green
  guarded: 240, // Blue-purple
  lit: 120,     // Yellow-green
  anxious: 280, // Purple
  low: 220      // Blue
}[recalledEmotion];

avatar.setGlowColor(hue, saturation: 0.6, lightness: 0.5);
```

### 2. Resource Suggestions

```typescript
// Trigger resources based on recurring topics + emotion
if (topics.includes("housing") && emotionProfile.guarded > 0.6) {
  suggestResource({
    type: "housing-assistance",
    priority: "high",
    reason: "Recurring housing concerns with elevated stress",
  });
}
```

### 3. Temporal Emotion Smoothing

```typescript
// Blend current with previous emotion
const smoothedEmotion = {
  calm: 0.7 * current.calm + 0.3 * previous.calm,
  guarded: 0.7 * current.guarded + 0.3 * previous.guarded,
  lit: 0.7 * current.lit + 0.3 * previous.lit,
};
```

---

## ✅ Summary

**Integrated Layers:**

- ✅ Memory entries include `tone`, `emotion`, `emotionVector`
- ✅ Signal Engine updates `systemTrust` (trust_delta) and `mentalHealthRisk` (emotion_intensity)
- ✅ Siani's TTS chooses `prosodyConfig` dynamically from emotional state
- ✅ Relational memory retrieves contextually similar conversations
- ✅ Full pipeline accessible via `/api/siani/interact`

**Data Flow:**

1. User speaks → Prosody extracted
2. Emotion classified → Vector generated
3. Context retrieved → Similar memories found
4. Memory stored → With tone + emotion + prosody
5. Signal updated → Trust delta + emotion risk
6. Response generated → Contextually aware
7. Prosody selected → Emotionally adaptive TTS
8. Siani speaks → With perfect emotional resonance 💜

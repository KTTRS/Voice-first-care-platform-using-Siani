# Siani Intelligence - Quick Reference

## 🚀 Quick Start

### Process Voice Interaction

```bash
curl -X POST http://localhost:3000/api/siani/interact \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "transcript": "I am feeling anxious",
    "prosodyData": {
      "pitchHz": 220,
      "energy": 0.65,
      "emotion": "anxious"
    }
  }'
```

### Get Relational Context

```bash
curl http://localhost:3000/api/siani/context/user-123
```

---

## 📊 Emotion → Vector Mapping

| Emotion  | Vector [calm, guarded, lit] |
| -------- | --------------------------- |
| calm     | [0.8, 0.1, 0.1]             |
| neutral  | [0.5, 0.3, 0.2]             |
| anxious  | [0.2, 0.7, 0.1]             |
| guarded  | [0.2, 0.7, 0.1]             |
| low      | [0.3, 0.6, 0.1]             |
| detached | [0.1, 0.8, 0.1]             |
| high     | [0.3, 0.2, 0.5]             |
| lit      | [0.2, 0.1, 0.7]             |

---

## 🎨 Tone Selection

| User Emotion | Trust Level | Siani Tone |
| ------------ | ----------- | ---------- |
| anxious      | Any         | gentle     |
| guarded      | High        | supportive |
| guarded      | Low         | gentle     |
| low          | Any         | empathetic |
| calm         | High        | warm       |
| calm         | Low         | supportive |
| lit          | High        | energetic  |

---

## 🎤 Prosody Config

### Anxious/Guarded User

```json
{
  "pitch": -2,
  "speakingRate": 0.9,
  "volumeGain": -2
}
```

### Low/Detached User

```json
{
  "pitch": 1,
  "speakingRate": 0.95,
  "volumeGain": 0
}
```

### Lit/High User

```json
{
  "pitch": 2,
  "speakingRate": 1.1,
  "volumeGain": 1
}
```

---

## 📈 Trust Delta Formula

```typescript
// Vulnerability scores
const vulnerability = {
  low: 0.8, // Highest trust boost
  anxious: 0.7,
  guarded: 0.6,
  neutral: 0.3,
  calm: 0.5,
  high: 0.4,
  detached: 0.2,
  lit: 0.5,
};

// Trust delta per interaction
const trustDelta = vulnerability[emotion] * 0.1; // Max 0.08

// Update signal score
const newSystemTrust = systemTrust - trustDelta * 10;
```

---

## 🧪 TypeScript Usage

### Import

```typescript
import { sianiIntelligenceService } from "../services/sianiIntelligence.service";
```

### Process Interaction

```typescript
const response = await sianiIntelligenceService.processVoiceInteraction({
  userId: "user-123",
  transcript: "I'm feeling stressed",
  prosodyData: {
    pitchHz: 220,
    energy: 0.65,
    emotion: "anxious",
  },
  detectedEmotion: "anxious",
});

console.log(response.text); // Siani's response
console.log(response.tone); // "gentle"
console.log(response.prosodyConfig); // { pitch: -2, rate: 0.9, gain: -2 }
console.log(response.relationalContext); // { trustLevel: 0.78, ... }
```

---

## 📝 Response Format

```typescript
{
  text: string;                    // Siani's response
  emotion: EmotionLevel;            // Siani's emotion
  emotionVector: [0.2, 0.7, 0.1];  // [calm, guarded, lit]
  tone: "gentle";                   // Selected tone
  prosodyConfig: {
    pitch: -2,                      // -20 to +20
    speakingRate: 0.9,              // 0.25 to 4.0
    volumeGain: -2                  // -96 to +16
  },
  relationalContext: {
    trustLevel: 0.78,               // 0-1
    familiarity: 0.82,              // 0-1
    continuity: 0.65                // 0-1
  },
  contextualMemories: [...]         // Similar past conversations
}
```

---

## 🔗 Integration Points

### Signal Engine

```typescript
// Trust delta updates systemTrust
// Emotion risk updates mentalHealthRisk
const signalScore = await prisma.signalScore.findFirst({
  where: { userId },
  orderBy: { createdAt: "desc" },
});
```

### Memory Service

```typescript
// Stores with tone + emotion + prosody
await createMemoryMoment(
  {
    userId,
    content: transcript,
    emotion: "anxious",
    tone: "gentle",
    metadata: {
      emotionVector: [0.2, 0.7, 0.1],
      trustLevel: 0.78,
    },
  },
  prosodyData
);
```

### Relational Memory

```typescript
// Retrieves contextually similar memories
const context = await relationalMemoryService.retrieveContext(
  userId,
  transcript,
  emotion,
  emotionVector,
  5
);
```

---

## 🐛 Troubleshooting

### No contextual memories returned

- First conversation has no history
- Check emotion vector similarity threshold (> 0.75)

### Trust not updating

- Verify signal score exists for user
- Check vulnerability score mapping

### Prosody config seems wrong

- Verify trust level calculation
- Check emotion inference from prosody data

---

## 📚 Full Documentation

See `SIANI_INTELLIGENCE_INTEGRATION.md` for complete integration guide.

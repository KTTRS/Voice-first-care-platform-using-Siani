# Emotion Classifier Quick Reference

**3-Category emotion mapping: Calm, Guarded, Lit**

---

## Quick Start

### Backend API

```bash
curl -X POST http://localhost:3000/api/emotion/classify \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I feel great today!",
    "features": {
      "pitch_contour": [220, 250, 270],
      "energy_curve": [0.8, 0.85],
      "speech_rate": 2.0
    }
  }'
```

### Mobile Hook

```typescript
const { classify } = useEmotionClassifier();

const result = await classify({
  transcript: userSpeech,
  pitch_contour: prosody.pitches,
  energy_curve: prosody.energies,
  speech_rate: prosody.rate,
});

// Apply to TTS and avatar
Speech.speak(response, {
  pitch: 1.0 + result.modulation_params.tts_pitch_shift,
  rate: result.modulation_params.tts_speed_scale,
});
```

---

## Emotion Categories

| Emotion     | Characteristics                  | Modulation                                   |
| ----------- | -------------------------------- | -------------------------------------------- |
| **Calm**    | Grounded, steady, regulated      | Pitch -0.02, Speed 0.95, Glow 0.4 (sine)     |
| **Guarded** | Cautious, tense, uncertain       | Pitch +0.03, Speed 0.85, Glow 0.25 (ease-in) |
| **Lit**     | Energetic, confident, passionate | Pitch +0.08, Speed 1.15, Glow 0.9 (cubic)    |

---

## Feature Thresholds

| Feature           | Calm      | Guarded   | Lit     |
| ----------------- | --------- | --------- | ------- |
| Pitch (Hz)        | 130-170   | 160-240   | 200-300 |
| Energy            | 0.25-0.45 | 0.15-0.35 | 0.6-1.0 |
| Speech Rate (wps) | 1.0-1.4   | 0.7-1.1   | 1.8-2.5 |

---

## API Endpoints

- `POST /api/emotion/classify` - Single classification
- `POST /api/emotion/classify/batch` - Batch classification

---

## Integration Pattern

```typescript
const { processWithEmotion } = useEmotionSync({
  applyToTTS: true,
  applyToAvatar: true,
});

await processWithEmotion(userTranscript, prosodyFeatures, sianiResponse);
```

---

## Files

- Backend: `emotionClassifier.service.ts`, `emotionClassifier.routes.ts`
- Mobile: `useEmotionClassifier.ts`, `useEmotionSync.ts`
- Test: `test-emotion-classifier.sh`

# Emotion Classification System (Calm, Guarded, Lit)

**Complete implementation of emotion-mapping model for voice and text classification with synchronized TTS and avatar modulation.**

---

## Overview

The emotion classification system maps voice and transcript data to three emotional categories:

- **Calm**: Grounded, steady, emotionally regulated
- **Guarded**: Cautious, tense, uncertain
- **Lit**: Energetic, confident, passionate

Each classification includes modulation parameters that drive synchronized TTS voice characteristics and avatar animation.

---

## Architecture

### Input Features

```typescript
{
  transcript: string;              // Spoken utterance text
  pitch_contour?: number[];        // Array of pitch values per frame (Hz)
  energy_curve?: number[];         // Normalized loudness values 0-1
  speech_rate?: number;            // Words per second
  pause_durations?: number[];      // Pause lengths in milliseconds
  prosody_summary?: string;        // "<mean_pitch>_<energy_mean>_<tempo>"
  lexical_tone_indicators?: string[]; // Keywords, emotion words, hedges
}
```

### Output Classification

```typescript
{
  emotion_category: "calm" | "guarded" | "lit";
  confidence: number; // 0-1
  modulation_params: {
    tts_pitch_shift: number; // Float pitch adjustment
    tts_speed_scale: number; // Speed multiplier
    glow_intensity: number; // 0-1 glow strength
    glow_easing_curve: "sine" | "ease-in" | "cubic";
  }
}
```

---

## Classification Algorithm

### Feature Extraction

1. **Acoustic Features**:

   - Mean pitch (Hz)
   - Mean energy (RMS, 0-1)
   - Speech rate (words/second)
   - Pitch variability (standard deviation)
   - Pause frequency and duration

2. **Lexical Features**:
   - Calm indicators: "yeah", "actually", "clear", "peaceful", "helped"
   - Guarded indicators: "i mean", "i guess", "maybe", "kind of", "tired"
   - Lit indicators: "let's do it", "amazing", "excited", "can't wait", "ready"

### Scoring System

Each emotion category receives a score (0-1) based on weighted features.

---

## API Endpoints

### POST /api/emotion/classify

Classify a single utterance.

**Request**:

```json
{
  "transcript": "I feel so peaceful right now",
  "features": {
    "pitch_contour": [140, 145, 150, 145, 140],
    "energy_curve": [0.35, 0.38, 0.36],
    "speech_rate": 1.1
  }
}
```

**Response**:

```json
{
  "emotion_category": "calm",
  "confidence": 0.94,
  "modulation_params": {
    "tts_pitch_shift": -0.02,
    "tts_speed_scale": 0.95,
    "glow_intensity": 0.4,
    "glow_easing_curve": "sine"
  }
}
```

---

## Mobile Integration

### React Native Hook

```typescript
import { useEmotionClassifier } from "./hooks/useEmotionClassifier";

const { classify, classification } = useEmotionClassifier();

const result = await classify({
  transcript: "I'm so excited!",
  pitch_contour: [220, 250, 270],
  energy_curve: [0.8, 0.85],
  speech_rate: 2.0,
});
```

---

## Testing

```bash
./test-emotion-classifier.sh
```

---

## Files Implemented

- ✅ `packages/backend/src/services/emotionClassifier.service.ts`
- ✅ `packages/backend/src/routes/emotionClassifier.routes.ts`
- ✅ `packages/mobile/hooks/useEmotionClassifier.ts`
- ✅ `packages/mobile/hooks/useEmotionSync.ts`
- ✅ `test-emotion-classifier.sh`

**Status**: ✅ Complete

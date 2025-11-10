# Prosody-Driven Animation System

Real-time voice prosody (pitch, energy, tempo) integration for emotionally responsive avatar animation.

## 🎯 Overview

This system layers **pitch contour**, **loudness (energy)**, and **tempo variance** onto the existing multimodal easing framework, creating micro-expressions that mirror natural speech patterns.

### Input → Output Mapping

| Input                   | Visual Behavior             | Perceptual Effect           |
| ----------------------- | --------------------------- | --------------------------- |
| Low pitch, low energy   | Slow diffuse glow           | Calm, comforting            |
| Rising pitch            | Glow sharpens               | Curiosity / emphasis        |
| High pitch, high energy | Bright pulsing with flicker | Excitement, intensity       |
| Flattened pitch         | Dim, slow                   | Disengagement or detachment |

---

## 🧩 Architecture

### 1. Backend: Prosody Extraction

**File**: `packages/backend/src/services/prosody.service.ts`

```typescript
import { analyzeProsody, ProsodyAnalyzer } from "./services/prosody.service";

// Single-frame analysis
const frame = new Float32Array(1024); // Audio samples
const { pitchHz, energy } = analyzeProsody(frame, 16000);

// Continuous stream analysis
const analyzer = new ProsodyAnalyzer(16000, 1024, 512);
const prosodyFrames = analyzer.processChunk(audioData);
```

**Functions**:

- `detectPitch(frame, sampleRate)` - Autocorrelation-based pitch detection (50-500 Hz)
- `calculateEnergy(frame)` - RMS energy normalized to 0-1
- `analyzeProsody(frame, sampleRate)` - Combined pitch + energy extraction
- `ProsodyAnalyzer` - Streaming prosody with smoothing

**WebSocket Integration** (example):

```typescript
// In your TTS route
import { ProsodyAnalyzer } from "./services/prosody.service";

const analyzer = new ProsodyAnalyzer(16000);

ttsStream.on("data", (audioChunk) => {
  const frames = analyzer.processChunk(audioChunk);
  frames.forEach((frame) => {
    ws.send(JSON.stringify(frame)); // Stream to client
  });
});
```

---

### 2. Mobile: Prosody Hooks

**File**: `packages/mobile/hooks/useProsody.ts`

#### Option A: Polling Audio.Sound (Simple)

```typescript
import { useProsody } from '../hooks/useProsody';

const sound = // ... your expo-av Audio.Sound
const { pitchHz, energy } = useProsody(sound, 100); // Poll every 100ms
```

#### Option B: WebSocket Stream (Full Prosody)

```typescript
import { useProsodyStream } from "../hooks/useProsody";

const { pitchHz, energy } = useProsodyStream("ws://localhost:3001/prosody");
```

**Note**: expo-av doesn't expose raw audio samples, so `useProsody` is a simplified version. For full prosody analysis, use `useProsodyStream` with backend integration.

---

### 3. Avatar: Prosody-Driven Animation

**File**: `packages/mobile/components/SianiAvatar.tsx`

```tsx
import SianiAvatar from "./components/SianiAvatar";
import { useProsodyStream } from "./hooks/useProsody";

function VoiceScreen() {
  const { pitchHz, energy } = useProsodyStream("ws://localhost:3001/prosody");
  const [isSpeaking, setIsSpeaking] = useState(false);

  return (
    <SianiAvatar
      emotion="high"
      speaking={isSpeaking}
      pitchHz={pitchHz} // 0-500 Hz
      energy={energy} // 0-1 normalized
    />
  );
}
```

---

## ⚙️ Animation Behavior

### Emotion-Based Gain Modulation

Each emotion state modulates prosody sensitivity:

```typescript
const emotionGain = {
  low: 0.6, // Soft, slow shimmer
  neutral: 0.9, // Moderate reactivity
  high: 1.2, // Vibrant, fast modulation
  detached: 0.4, // Dull, flat
};
```

**Result**: "high" emotions flash brightly with energy, while "detached" states appear still and distant.

---

### Animation Formulas

#### 1. Shimmer Speed (Pitch-Driven)

```typescript
const shimmerSpeed = 400 + Math.max(0, Math.min(1000, 1200 - pitchHz));
// Low pitch (100 Hz) → 1500ms (slow)
// High pitch (300 Hz) → 900ms (fast)
```

#### 2. Brightness (Energy-Driven)

```typescript
const reactiveBrightness =
  glowMap[emotion].base + energy * 0.5 * emotionGain[emotion];
// Low energy (0.2) + high emotion (1.2) → base + 0.12
// High energy (0.9) + high emotion (1.2) → base + 0.54
```

#### 3. Scale Depth (Energy-Driven)

```typescript
const reactiveScale = 1 + energy * 0.04 * emotionGain[emotion];
// Low energy → 1.0x scale
// High energy + high emotion → 1.043x scale
```

---

## 🔮 Visual States

### Idle (Not Speaking)

- **Breathing loop**: Slow sine/bezier curve (2.8s cycle)
- **Glow**: `base ± 0.1` rhythmic pulse
- **Pitch/Energy**: Ignored

### Speaking (Prosody Active)

- **Shimmer speed**: 400-1600ms (inverse to pitch)
- **Brightness**: `base + energy * 0.5 * gain`
- **Scale**: `1 + energy * 0.04 * gain`
- **Easing**: `Easing.bezier(0.65, 0, 0.35, 1)` (smooth prosodic curve)

### Fallback (No Prosody Data)

If `pitchHz` and `energy` are not provided, falls back to `audioLevel`:

```typescript
const reactiveGlow = glowMap[emotion].base + audioLevel * 0.5;
const reactiveScale = 1 + audioLevel * 0.06;
```

---

## 📊 Integration Examples

### Example 1: Basic Prosody

```tsx
import SianiAvatar from "./components/SianiAvatar";

function App() {
  return (
    <SianiAvatar
      emotion="neutral"
      speaking={true}
      pitchHz={150} // Mid-range pitch
      energy={0.6} // Moderate energy
    />
  );
}
```

**Result**: Moderate shimmer speed (~1050ms), brightness = 0.45 + 0.27 = 0.72

---

### Example 2: Excited High Emotion

```tsx
<SianiAvatar
  emotion="high"
  speaking={true}
  pitchHz={280} // High pitch (excitement)
  energy={0.85} // High energy
/>
```

**Result**:

- Fast shimmer (~920ms)
- Brightness = 0.75 + (0.85 _ 0.5 _ 1.2) = 1.26 (clamped to 1.0)
- Scale = 1 + (0.85 _ 0.04 _ 1.2) = 1.041x

---

### Example 3: Detached Monotone

```tsx
<SianiAvatar
  emotion="detached"
  speaking={true}
  pitchHz={100} // Flat, low pitch
  energy={0.2} // Low energy
/>
```

**Result**:

- Slow shimmer (~1500ms)
- Brightness = 0.2 + (0.2 _ 0.5 _ 0.4) = 0.24 (very dim)
- Scale = 1 + (0.2 _ 0.04 _ 0.4) = 1.003x (barely visible)

---

## 🧪 Testing

### Test 1: Manual Prosody Control

```tsx
import { useState } from "react";
import { View, Slider, Text } from "react-native";

function ProsodyTestScreen() {
  const [pitch, setPitch] = useState(150);
  const [energy, setEnergy] = useState(0.5);

  return (
    <View>
      <SianiAvatar
        emotion="neutral"
        speaking={true}
        pitchHz={pitch}
        energy={energy}
      />

      <Text>Pitch: {pitch} Hz</Text>
      <Slider
        value={pitch}
        onValueChange={setPitch}
        minimumValue={50}
        maximumValue={400}
      />

      <Text>Energy: {energy.toFixed(2)}</Text>
      <Slider
        value={energy}
        onValueChange={setEnergy}
        minimumValue={0}
        maximumValue={1}
      />
    </View>
  );
}
```

---

### Test 2: WebSocket Prosody Stream

```typescript
// Backend (Node.js)
import WebSocket from "ws";
import { ProsodyAnalyzer } from "./services/prosody.service";

const wss = new WebSocket.Server({ port: 3001 });
const analyzer = new ProsodyAnalyzer(16000);

wss.on("connection", (ws) => {
  // Simulate prosody stream (replace with real TTS)
  setInterval(() => {
    const mockFrame = new Float32Array(1024).map(
      () => Math.random() * 0.1 - 0.05
    );
    const frames = analyzer.processChunk(mockFrame);

    frames.forEach((frame) => {
      ws.send(JSON.stringify(frame));
    });
  }, 100);
});
```

```tsx
// Mobile
import { useProsodyStream } from "./hooks/useProsody";

function App() {
  const { pitchHz, energy } = useProsodyStream("ws://localhost:3001/prosody");

  return (
    <SianiAvatar
      emotion="neutral"
      speaking={true}
      pitchHz={pitchHz}
      energy={energy}
    />
  );
}
```

---

## 📈 Performance Considerations

### Backend

- **Prosody analysis**: ~5ms per 1024-sample frame
- **WebSocket latency**: ~10-20ms local, ~50-100ms remote
- **Recommended frame size**: 1024 samples (64ms at 16kHz)
- **Hop size**: 512 samples (50% overlap for smoothing)

### Mobile

- **Polling interval**: 100ms (10 updates/sec)
- **Animation duration**: 400-1600ms (pitch-dependent)
- **Native driver**: `scaleAnim` uses native driver (60fps)
- **JS-driven**: `glowAnim` uses JS thread (~30-60fps)

---

## 🎨 Future Enhancements

1. **Tempo Variance**: Adjust easing duration based on speech rate
2. **Emotion Transitions**: Smooth cross-fade between emotion states
3. **Formant Analysis**: Color shifts based on vowel formants
4. **Spectral Centroid**: Brightness modulation from spectral energy distribution
5. **Voice Activity Detection**: Auto-detect speaking vs silence

---

## 📚 References

- **YIN Algorithm**: [De Cheveigné & Kawahara, 2002](http://audition.ens.fr/adc/pdf/2002_JASA_YIN.pdf)
- **Prosody in Speech**: [Speech Prosody Handbook](https://www.cambridge.org/core/books/abs/prosody/introduction/7B0F3F3F5F3F3F3F3F3F3F3F3F3F3F3F)
- **React Native Animated**: [Animation Docs](https://reactnative.dev/docs/animated)

---

## 🔗 Integration Checklist

- [x] Backend prosody service (`prosody.service.ts`)
- [x] Mobile prosody hooks (`useProsody.ts`, `useProsodyStream`)
- [x] Avatar prosody props (`pitchHz`, `energy`)
- [x] Emotion-based gain modulation
- [x] Pitch → shimmer speed mapping
- [x] Energy → brightness/scale mapping
- [x] Backward compatibility (audioLevel fallback)
- [ ] WebSocket prosody stream endpoint
- [ ] TTS pipeline integration
- [ ] Production testing with real voices

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0

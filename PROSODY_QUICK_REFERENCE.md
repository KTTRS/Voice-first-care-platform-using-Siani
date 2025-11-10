# Prosody Animation Quick Reference

## 🚀 Quick Start

### 1. Import Components

```tsx
import SianiAvatar from "./components/SianiAvatar";
import { useProsodyStream } from "./hooks/useProsody";
```

### 2. Use in Component

```tsx
function VoiceScreen() {
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

## 📊 Props Reference

### SianiAvatar Props

| Prop         | Type                                         | Range  | Description              |
| ------------ | -------------------------------------------- | ------ | ------------------------ |
| `emotion`    | `'low' \| 'neutral' \| 'high' \| 'detached'` | -      | Emotional state          |
| `speaking`   | `boolean`                                    | -      | Whether voice is active  |
| `audioLevel` | `number` (optional)                          | 0-1    | RMS amplitude (fallback) |
| `pitchHz`    | `number` (optional)                          | 50-500 | Fundamental frequency    |
| `energy`     | `number` (optional)                          | 0-1    | Perceived loudness       |

---

## 🎨 Emotion → Visual Mapping

| Emotion    | Color      | Base Glow | Gain | Curve            |
| ---------- | ---------- | --------- | ---- | ---------------- |
| `low`      | 🔴 #FFB6B6 | 0.25      | 0.6  | Sine (soft)      |
| `neutral`  | 🟡 #FFD580 | 0.45      | 0.9  | Ease (balanced)  |
| `high`     | 🟢 #9CFFB0 | 0.75      | 1.2  | Bezier (vibrant) |
| `detached` | ⚪ #B0B0B0 | 0.20      | 0.4  | Linear (flat)    |

---

## 🔮 Prosody → Animation Mapping

### Pitch → Shimmer Speed

```
Speed = 400 + max(0, min(1000, 1200 - pitchHz))

Low pitch (100 Hz)  → 1500ms (slow shimmer)
Mid pitch (200 Hz)  → 1000ms (moderate)
High pitch (300 Hz) → 900ms (fast shimmer)
```

### Energy → Brightness

```
Brightness = base + energy * 0.5 * emotionGain

Low energy (0.2)  → base + 0.1 (dim)
Mid energy (0.5)  → base + 0.25 (moderate)
High energy (0.9) → base + 0.45 (bright)
```

### Energy → Scale

```
Scale = 1 + energy * 0.04 * emotionGain

Low energy  → 1.008x (minimal)
High energy → 1.043x (subtle pulse)
```

---

## 🧪 Test Scenarios

### Scenario 1: Calm Conversation

```tsx
<SianiAvatar emotion="low" speaking={true} pitchHz={120} energy={0.3} />
```

**Result**: Slow, soft glow (~1480ms shimmer, dim brightness)

---

### Scenario 2: Excited Explanation

```tsx
<SianiAvatar emotion="high" speaking={true} pitchHz={280} energy={0.85} />
```

**Result**: Fast, bright pulses (~920ms shimmer, intense glow)

---

### Scenario 3: Monotone Detachment

```tsx
<SianiAvatar emotion="detached" speaking={true} pitchHz={100} energy={0.15} />
```

**Result**: Barely visible, slow (~1500ms shimmer, very dim)

---

## 🔌 Backend Integration

### Prosody Service

```typescript
import { analyzeProsody } from "./services/prosody.service";

const frame = new Float32Array(1024); // Your audio samples
const { pitchHz, energy } = analyzeProsody(frame, 16000);
```

### WebSocket Stream

```typescript
import { ProsodyAnalyzer } from "./services/prosody.service";

const analyzer = new ProsodyAnalyzer(16000);

ttsStream.on("data", (chunk) => {
  const frames = analyzer.processChunk(chunk);
  frames.forEach((f) => ws.send(JSON.stringify(f)));
});
```

---

## 🎯 Common Patterns

### Pattern 1: Simple Playback

```tsx
const sound = // expo-av Audio.Sound
  <SianiAvatar emotion="neutral" speaking={true} audioLevel={0.5} />;
```

### Pattern 2: Full Prosody

```tsx
const { pitchHz, energy } = useProsodyStream(wsUrl);
<SianiAvatar
  emotion="high"
  speaking={true}
  pitchHz={pitchHz}
  energy={energy}
/>;
```

### Pattern 3: Emotion-Linked

```tsx
const emotion = emotionScore > 0.7 ? "high" : "neutral";
<SianiAvatar
  emotion={emotion}
  speaking={isSpeaking}
  pitchHz={pitch}
  energy={energy}
/>;
```

---

## ⚡ Performance Tips

1. **Use WebSocket** for real prosody (not expo-av polling)
2. **Smooth values** on backend (reduces jitter)
3. **Frame size**: 1024 samples @ 16kHz = 64ms latency
4. **Hop size**: 512 samples (50% overlap for smoothing)
5. **Poll interval**: 100ms on mobile (10 updates/sec)

---

## 🐛 Troubleshooting

| Issue                | Solution                                       |
| -------------------- | ---------------------------------------------- |
| Avatar not animating | Check `speaking={true}` is set                 |
| Jittery motion       | Add smoothing in backend (`ProsodyAnalyzer`)   |
| Delayed response     | Reduce WebSocket frame size or poll interval   |
| No prosody data      | Verify backend WebSocket is streaming JSON     |
| Flat animation       | Check `emotionGain` - "detached" has 0.4x gain |

---

## 📚 Files Reference

- **Avatar**: `packages/mobile/components/SianiAvatar.tsx`
- **Hooks**: `packages/mobile/hooks/useProsody.ts`
- **Service**: `packages/backend/src/services/prosody.service.ts`
- **Guide**: `PROSODY_ANIMATION_GUIDE.md`

---

**Version**: 1.0.0  
**Last Updated**: November 10, 2025

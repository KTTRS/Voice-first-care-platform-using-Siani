# Enhanced Emotion Avatar - Quick Reference

## 🚀 Quick Start

### Import and Use

```tsx
import EmotionAvatarEnhanced from "../components/EmotionAvatarEnhanced";

export default function MyScreen() {
  return (
    <EmotionAvatarEnhanced
      size={180}
      floatingPosition="bottom-center"
      onPress={() => console.log("Avatar pressed")}
      enableWearableSync={false} // Optional BLE sync
    />
  );
}
```

---

## 🎨 Emotion States & Colors

| Emotion       | Primary Color         | Secondary Color       | Intensity | Pulse Speed        |
| ------------- | --------------------- | --------------------- | --------- | ------------------ |
| **Calm**      | Soft Pink `#FFB6B6`   | Light Pink `#FFD4D4`  | 0.5       | 2000ms (slow)      |
| **Anxious**   | Warm Amber `#FFC14D`  | Light Amber `#FFE5B3` | 0.7       | 800ms (fast)       |
| **Motivated** | Mint Green `#9CFFB0`  | Gold `#DAA520`        | 0.9       | 1200ms (energetic) |
| **Neutral**   | Gentle Gold `#FFD580` | Pale Gold `#FFEABB`   | 0.4       | 2500ms (very slow) |

---

## 🎭 Avatar States

| State          | Visual                       | Haptic                 | When                  |
| -------------- | ---------------------------- | ---------------------- | --------------------- |
| **Idle**       | Gentle breathing glow        | None                   | Default state         |
| **Listening**  | Rhythmic pulse + sound waves | Heartbeat (every 1.5s) | User speaking         |
| **Processing** | Fast shimmer                 | Single selection tap   | Analyzing speech      |
| **Thinking**   | Tightening glow              | None                   | 300ms before response |
| **Responding** | Leaning pulse + rings        | Pulse on start         | Siani speaking        |

---

## 🎬 Animation Types

### Sine-Wave Glow (Continuous)

- **What**: Organic pulsing using sine curve
- **Speed**: Based on emotion (800ms - 2500ms)
- **Amplitude**: 0.2 - 0.6 intensity range

### Micro-Animations

#### Breathing

```typescript
// When: Idle, Listening
// Effect: 1.0x → 1.03x scale over 3s
// Purpose: Shows "alive" presence
```

#### Leaning

```typescript
// When: Responding
// Effect: -2° to +2° rotation
// Purpose: Conversational body language
```

#### Flickering

```typescript
// When: Processing
// Effect: 1.0 → 0.85 → 1.0 opacity
// Purpose: Thinking indicator
```

#### Tightening

```typescript
// When: Pre-response (300ms)
// Effect: 0.97x → 1.02x scale
// Purpose: Anticipation before reply
```

---

## 📳 Haptic Feedback Patterns

### On Avatar Press

```typescript
if (emotionIntensity >= 0.7) {
  // High intensity → Success notification
  Haptics.notificationAsync(NotificationFeedbackType.Success);
} else {
  // Normal → Medium impact
  Haptics.impactAsync(ImpactFeedbackStyle.Medium);
}
```

### During Listening

```typescript
// Light heartbeat every 1.5s
setInterval(() => {
  Haptics.impactAsync(ImpactFeedbackStyle.Light);
}, 1500);
```

### During Processing

```typescript
// Single selection tap
Haptics.selectionAsync();
```

### During Response

```typescript
// Single medium impact at start
Haptics.impactAsync(ImpactFeedbackStyle.Medium);
```

---

## 🔧 Configuration

### Adjust Glow Intensity

```typescript
// In glowLogic.ts
import { GLOW_MAP } from "../utils/glowLogic";

GLOW_MAP.calm.intensity = 0.7; // Brighter calm
GLOW_MAP.anxious.waveAmplitude = 0.8; // Wider pulse range
```

### Adjust Pulse Speed

```typescript
GLOW_MAP.motivated.pulseSpeed = 1000; // Faster pulse
```

### Adjust Pre-Response Delay

```typescript
export const PRE_RESPONSE_DELAY_MS = 400; // Longer anticipation
```

### Adjust Micro-Animations

```typescript
MICRO_ANIMATION_CONFIG.breathe.duration = 4000; // Slower breathing
MICRO_ANIMATION_CONFIG.lean.rotate = [0, 5, 0]; // More lean
```

---

## 🎯 State Transitions

### Voice Pipeline Flow

```
User starts speaking
    ↓
[IDLE] → [LISTENING]
    • Heartbeat haptic starts (1.5s interval)
    • Breathing animation
    • Sound wave indicators appear
    ↓
User finishes speaking
    ↓
[LISTENING] → [PROCESSING]
    • Heartbeat stops
    • Shimmer animation
    • Single selection haptic
    ↓
Response ready (auto 300ms delay)
    ↓
[PROCESSING] → [THINKING]
    • Tightening animation (0.97x → 1.02x)
    • No haptic
    ↓
After 300ms
    ↓
[THINKING] → [RESPONDING]
    • Leaning animation
    • Pulse tied to TTS
    • Speaking rings appear
    • Single medium impact haptic
    ↓
Response finishes
    ↓
[RESPONDING] → [IDLE]
    • Return to gentle breathing
    • No haptic
```

### Manual State Control

```tsx
const { setListening, setSpeaking } = useEmotionStore();

// Start listening
setListening(true);

// Stop listening (auto enters processing)
setListening(false);

// Start speaking (auto enters thinking → responding)
setSpeaking(true);

// Stop speaking (auto returns to idle)
setSpeaking(false);
```

---

## 🧪 Testing Commands

### Test State Machine

```tsx
const testAvatarStates = async () => {
  const { setListening, setSpeaking } = useEmotionStore();

  console.log("Testing avatar states...");

  // Test 1: Listening
  console.log("→ Listening state (3s)");
  setListening(true);
  await delay(3000);

  // Test 2: Processing
  console.log("→ Processing state (1s)");
  setListening(false);
  await delay(1000);

  // Test 3: Thinking → Responding
  console.log("→ Thinking → Responding (2.5s)");
  setSpeaking(true);
  await delay(2500);

  // Test 4: Idle
  console.log("→ Idle state");
  setSpeaking(false);

  console.log("✅ Test complete");
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
```

### Test Emotion Changes

```tsx
const testEmotions = async () => {
  const { setEmotion } = useEmotionStore();

  const emotions = ["calm", "anxious", "motivated", "neutral"];

  for (const emotion of emotions) {
    console.log(`Testing ${emotion}...`);
    setEmotion(emotion as EmotionState);
    await delay(3000); // Observe glow color/speed
  }
};
```

---

## 🎨 Visual Indicators

### Sound Waves (Listening)

```tsx
<View style={styles.listeningIndicator}>
  <View style={[styles.soundWave, styles.wave1]} /> {/* 12px */}
  <View style={[styles.soundWave, styles.wave2]} /> {/* 20px */}
  <View style={[styles.soundWave, styles.wave3]} /> {/* 16px */}
</View>
```

### Speaking Rings (Responding)

```tsx
<View style={styles.speakingIndicator}>
  <View style={[styles.speakingRing, styles.ring1]} /> {/* 40px */}
  <View style={[styles.speakingRing, styles.ring2]} /> {/* 56px */}
</View>
```

### Shimmer Dot (Processing)

```tsx
<View style={styles.processingIndicator}>
  <View style={styles.shimmerDot} /> {/* 8px dot */}
</View>
```

### Thinking Ring (Pre-Response)

```tsx
<View style={styles.thinkingIndicator}>
  <View style={styles.thinkingRing} /> {/* 50px ring */}
</View>
```

---

## 🔮 Wearable Integration (Future)

### Enable Sync

```tsx
<EmotionAvatarEnhanced enableWearableSync={true} />
```

### Subscribe to Events

```tsx
import { hapticEventBus } from "../utils/glowLogic";

// Subscribe
hapticEventBus.subscribe("myDevice", (event) => {
  console.log("Haptic event:", event);
  // event = {
  //   type: "heartbeat" | "pulse" | "glow" | "shimmer",
  //   intensity: 0.0 - 1.0,
  //   duration: ms,
  //   emotion?: "calm" | "anxious" | "motivated" | "neutral"
  // }

  // Send to BLE device
  bleDevice.vibrate(event.intensity, event.duration);
});

// Cleanup
useEffect(() => {
  return () => {
    hapticEventBus.unsubscribe("myDevice");
  };
}, []);
```

---

## 📊 Performance

### Animation Frame Rates

- **Sine-wave glow**: 60fps (requestAnimationFrame)
- **Micro-animations**: Native driver (60fps)
- **State transitions**: 300ms smooth crossfade

### Battery Impact

- **Low**: Animations use native driver where possible
- **Minimal haptics**: Only during user interactions
- **Auto-pause**: When app backgrounded

### Memory Usage

- **Small**: 8 animation refs
- **Cleanup**: All refs properly disposed
- **Event bus**: Lightweight subscription model

---

## 🐛 Troubleshooting

### Avatar not pulsing

```typescript
// Check emotion store
const { currentEmotion, emotionIntensity } = useEmotionStore();
console.log({ currentEmotion, emotionIntensity });

// Verify glow config
import { GLOW_MAP } from "../utils/glowLogic";
console.log(GLOW_MAP[currentEmotion]);
```

### No haptic feedback

```typescript
// Check platform (haptics don't work on web)
console.log(Platform.OS); // Should be "ios" or "android"

// Check shouldHaptic flag
const { shouldHaptic } = useEmotionStore();
console.log({ shouldHaptic });
```

### State not changing

```typescript
// Monitor state changes
const { isListening, isSpeaking } = useEmotionStore();
useEffect(() => {
  console.log({ isListening, isSpeaking });
}, [isListening, isSpeaking]);
```

### Animations laggy

```typescript
// Ensure native driver is enabled
useNativeDriver: true; // ✅ Good
useNativeDriver: false; // ⚠️ May cause lag
```

---

## 📚 Related Files

- **Implementation**: `packages/mobile/components/EmotionAvatarEnhanced.tsx`
- **Logic**: `packages/mobile/utils/glowLogic.ts`
- **Store**: `packages/mobile/store/emotionStore.ts`
- **Original**: `packages/mobile/components/EmotionAvatar.tsx` (preserved)
- **Full Guide**: `GLOW_LOGIC_IMPLEMENTATION.md`

---

## ✅ Checklist

**When integrating enhanced avatar:**

- [ ] Import `EmotionAvatarEnhanced` instead of `EmotionAvatar`
- [ ] Verify size prop (default: 80)
- [ ] Set `floatingPosition` ("bottom-right", "bottom-center", or "center")
- [ ] Add `onPress` handler if needed
- [ ] Test on physical device (haptics don't work in simulator)
- [ ] Observe state transitions during voice interaction
- [ ] Check glow color matches emotion
- [ ] Verify pre-response delay (300ms) before speaking

---

**Last Updated**: 2025-01-03  
**Version**: 1.0.0

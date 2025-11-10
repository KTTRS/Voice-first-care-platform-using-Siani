# SianiAvatar Integration Guide

## Overview

The `SianiAvatar` component has been enhanced with emotion-based glow mapping and integrated with the advanced glow logic system. It now features:

- ✅ **Emotion-based colors** from `GLOW_MAP` (calm/anxious/motivated/neutral)
- ✅ **Dynamic pulse speeds** tied to emotion states
- ✅ **Advanced haptic feedback** (Success/Medium/Light based on intensity)
- ✅ **Voice state animations** (listening, speaking, idle)
- ✅ **Continuous sine-wave-like glow pulsing**

---

## Usage Examples

### Basic Usage

```tsx
import SianiAvatar from "../components/SianiAvatar";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <SianiAvatar size={120} onPress={() => navigation.navigate("Siani")} />
    </View>
  );
}
```

### With Emotion Store (Automatic)

The avatar automatically connects to the emotion store:

```tsx
import SianiAvatar from "../components/SianiAvatar";
import { useEmotionStore } from "../store/emotionStore";

export default function SianiScreen() {
  const { isListening, isSpeaking } = useEmotionStore();

  return (
    <View style={styles.container}>
      <SianiAvatar
        size={180}
        isListening={isListening}
        isSpeaking={isSpeaking}
        onPress={() => console.log("Avatar tapped")}
      />
    </View>
  );
}
```

### With Manual Emotion Control

Override the emotion store with props:

```tsx
import SianiAvatar from "../components/SianiAvatar";

export default function CustomScreen() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>("calm");

  return (
    <View>
      <SianiAvatar
        size={160}
        emotion={currentEmotion}
        isListening={false}
        isSpeaking={false}
      />

      {/* Emotion controls */}
      <Button title="Calm" onPress={() => setCurrentEmotion("calm")} />
      <Button title="Anxious" onPress={() => setCurrentEmotion("anxious")} />
      <Button
        title="Motivated"
        onPress={() => setCurrentEmotion("motivated")}
      />
      <Button title="Neutral" onPress={() => setCurrentEmotion("neutral")} />
    </View>
  );
}
```

---

## Emotion-Based Glow Colors

The avatar now uses dynamic colors from `GLOW_MAP`:

| Emotion       | Primary Color         | Secondary Color       | Pulse Speed | Intensity |
| ------------- | --------------------- | --------------------- | ----------- | --------- |
| **Calm**      | Blush Pink `#FFB6B6`  | Light Pink `#FFD4D4`  | 2000ms      | 0.5       |
| **Anxious**   | Warm Amber `#FFC14D`  | Light Amber `#FFE5B3` | 800ms       | 0.7       |
| **Motivated** | Mint Green `#9CFFB0`  | Gold `#DAA520`        | 1200ms      | 0.9       |
| **Neutral**   | Gentle Gold `#FFD580` | Pale Gold `#FFEABB`   | 2500ms      | 0.4       |

### State-Based Glow

- **Idle**: Subtle emotion color with 33% opacity
- **Listening**: Emotion color with 66% opacity (breathing effect)
- **Speaking**: Secondary emotion color with 80% opacity (pulsing)

---

## Haptic Feedback Patterns

The avatar provides advanced haptic feedback based on emotion intensity:

```typescript
// High intensity (>= 0.7)
Haptics.notificationAsync(NotificationFeedbackType.Success);

// Low intensity (<= 0.3)
Haptics.impactAsync(ImpactFeedbackStyle.Light);

// Medium intensity (0.3 - 0.7)
Haptics.impactAsync(ImpactFeedbackStyle.Medium);
```

---

## Animation Behaviors

### Breathing Animation

- **Duration**: 3 seconds per cycle (inhale/exhale)
- **Scale**: 1.0x → 1.08x → 1.0x
- **Always active**: Creates "alive" presence

### Glow Pulsing

- **Duration**: Based on emotion (800ms - 2500ms)
- **Intensity**: Emotion-specific (0.4 - 0.9)
- **Pattern**: High intensity → Low intensity (30% of high)

### Active State Pulse

- **Listening**: 1.15x scale, 600ms per cycle
- **Speaking**: 1.15x scale, 600ms per cycle
- **Faster than breathing**: Shows activity

---

## Voice State Indicators

### Listening

```tsx
{
  isListening && (
    <View style={styles.listeningIndicator}>
      <View style={styles.waveBar} /> {/* 16px */}
      <View style={styles.waveBarMid} /> {/* 24px */}
      <View style={styles.waveBar} /> {/* 16px */}
    </View>
  );
}
```

- 3 vertical bars below avatar
- Colored with current emotion

### Speaking

```tsx
{
  isSpeaking && (
    <View style={styles.speakingIndicator}>
      <Animated.View style={styles.speakingRing} />
    </View>
  );
}
```

- Pulsing ring inside avatar
- Colored with current emotion

---

## Integration with Voice Pipeline

### SianiScreen Example

```tsx
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import SianiAvatar from "../components/SianiAvatar";
import { useEmotionStore } from "../store/emotionStore";
import { voiceManager } from "../utils/voice";

export default function SianiScreen() {
  const {
    isListening,
    isSpeaking,
    currentEmotion,
    setListening,
    setSpeaking,
    setEmotion,
  } = useEmotionStore();

  // Auto-start passive listening
  useEffect(() => {
    const initVoice = async () => {
      await voiceManager.initialize();
      setListening(true);
    };

    initVoice();

    return () => {
      voiceManager.stopPassiveListening();
      setListening(false);
    };
  }, []);

  // Voice transcription callback
  const handleTranscription = (transcript: string) => {
    setListening(false);

    // Analyze emotion from transcript
    const detectedEmotion = analyzeEmotion(transcript);
    setEmotion(detectedEmotion);

    // Generate response
    setSpeaking(true);
    generateResponse(transcript).then(() => {
      setSpeaking(false);
      setListening(true); // Resume listening
    });
  };

  return (
    <View style={styles.container}>
      <SianiAvatar
        size={180}
        isListening={isListening}
        isSpeaking={isSpeaking}
        emotion={currentEmotion}
        onPress={() => {
          // Toggle listening on tap
          if (isListening) {
            voiceManager.stopPassiveListening();
            setListening(false);
          } else {
            voiceManager.startPassiveListening(handleTranscription);
            setListening(true);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
  },
});
```

---

## Props API

```typescript
interface SianiAvatarProps {
  size?: number; // Avatar diameter (default: 120)
  isListening?: boolean; // Show listening state (default: false)
  isSpeaking?: boolean; // Show speaking state (default: false)
  emotion?: EmotionState; // Override emotion store ('calm' | 'anxious' | 'motivated' | 'neutral')
  onPress?: () => void; // Tap handler
  style?: any; // Additional container styles
}
```

---

## Styling Customization

### Change Avatar Size

```tsx
<SianiAvatar size={200} /> {/* Large */}
<SianiAvatar size={80} />  {/* Small */}
```

### Position in Layout

```tsx
<View style={{ position: "absolute", top: 50, right: 20 }}>
  <SianiAvatar size={100} />
</View>
```

### Custom Container Styles

```tsx
<SianiAvatar
  size={150}
  style={{
    marginTop: 40,
    shadowColor: "#FFB6B6",
    shadowRadius: 30,
  }}
/>
```

---

## Comparison with EmotionAvatarEnhanced

| Feature                | SianiAvatar                           | EmotionAvatarEnhanced                      |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| **Design**             | Circular matte black with gold center | Multi-layer glassmorphic                   |
| **Complexity**         | Simple, minimal                       | Advanced with 8 animations                 |
| **Use Case**           | Main avatar on screens                | Feature-rich interactive avatar            |
| **Micro-Animations**   | Breathing only                        | Breathing, leaning, flickering, tightening |
| **State Machine**      | No                                    | Yes (5 states)                             |
| **Pre-Response Delay** | No                                    | Yes (300ms)                                |
| **Wearable Sync**      | No                                    | Yes (HapticEventBus)                       |
| **Portrait Support**   | Could be added                        | No (abstract design)                       |

**When to use SianiAvatar**: Clean, simple presence on Home/Siani screens  
**When to use EmotionAvatarEnhanced**: Full interactive experience with voice pipeline

---

## Testing

### Manual Testing

```tsx
import { useEffect, useState } from "react";

export function TestSianiAvatar() {
  const [emotion, setEmotion] = useState<EmotionState>("calm");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-cycle emotions
  useEffect(() => {
    const emotions: EmotionState[] = [
      "calm",
      "anxious",
      "motivated",
      "neutral",
    ];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % emotions.length;
      setEmotion(emotions[index]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Test voice states
  const testVoiceStates = async () => {
    console.log("→ Listening");
    setIsListening(true);
    await delay(3000);

    console.log("→ Speaking");
    setIsListening(false);
    setIsSpeaking(true);
    await delay(3000);

    console.log("→ Idle");
    setIsSpeaking(false);
  };

  return (
    <View>
      <SianiAvatar
        size={180}
        emotion={emotion}
        isListening={isListening}
        isSpeaking={isSpeaking}
      />

      <Button title="Test Voice States" onPress={testVoiceStates} />
    </View>
  );
}
```

---

## Migration from Old SianiAvatar

The component is **backward compatible**. Existing code will work:

```tsx
// Old usage (still works)
<SianiAvatar
  size={120}
  isListening={true}
  isSpeaking={false}
  onPress={handlePress}
/>

// New usage (with emotion control)
<SianiAvatar
  size={120}
  emotion="anxious"      // ← NEW: Manual emotion
  isListening={true}
  isSpeaking={false}
  onPress={handlePress}
/>
```

---

## Future Enhancements

### Portrait Image Support

To add portrait image (like your example):

```tsx
import { Image } from "react-native";

// Add after centerDot
<Image
  source={require("../assets/siani-portrait.jpg")}
  style={{
    width: size - 20,
    height: size - 20,
    borderRadius: (size - 20) / 2,
    position: "absolute",
  }}
/>;
```

### TTS Waveform Sync

When TTS amplitude data becomes available:

```tsx
const { ttsAmplitude } = useTTSState();

<SianiAvatar
  size={180}
  isSpeaking={true}
  ttsAmplitude={ttsAmplitude} // 0-1
/>;
```

---

## Summary

✅ **Enhanced with emotion-based glow mapping**  
✅ **Integrated with GLOW_MAP from glowLogic.ts**  
✅ **Advanced haptic feedback** (Success/Medium/Light)  
✅ **Dynamic pulse speeds** (800ms - 2500ms)  
✅ **Backward compatible** with existing code  
✅ **Ready for voice pipeline integration**

**Status**: Production ready ✨

---

**Last Updated**: 2025-11-10  
**Version**: 2.0.0 (Enhanced)

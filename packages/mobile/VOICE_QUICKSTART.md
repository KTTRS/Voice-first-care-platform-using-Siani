# 🎙️ Voice-First Quick Start Guide

## Overview

Siani mobile app is a **voice-first conversational companion** built with React Native and Expo. This guide will help you get started with the voice capture functionality.

## ✨ Key Features

### 1. **Voice Conversation Screen**
- Full-screen immersive voice interaction
- Tap the breathing Siani avatar to start/stop recording
- Real-time waveform visualization
- Text-to-speech responses from Siani
- Message history with luxury styling

### 2. **SianiAvatar Component**
- Always breathing, alive animation (6-second cycle)
- Glows when listening (gold pulse)
- Active ring when speaking
- Haptic feedback on interaction
- Customizable size

### 3. **WaveformVisualizer**
- 5-bar animated waveform
- Different animations for listening vs. speaking
- Gold color scheme matching brand
- Status text display

### 4. **Voice Intelligence**
- SDOH (Social Determinants of Health) passive detection
- Emotional mood tracking
- Memory and context awareness
- Resource offering with empathy
- Rapport building over time

## 🚀 Getting Started

### Prerequisites

1. **Install Dependencies**
   ```bash
   cd packages/mobile
   npm install
   ```

2. **Create Assets** (if missing)
   - The app requires icons and splash screens in `assets/` directory
   - These should already be created when you ran the setup

3. **Configure Environment**
   ```bash
   # Ensure .env file exists with:
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Start Backend** (required for full functionality)
   ```bash
   cd packages/backend
   npm run dev
   ```

### Running the App

```bash
cd packages/mobile
npm start
# or
npx expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 Using Voice Capture

### Basic Voice Conversation

1. **Navigate to Conversation Screen**
   - Open the app
   - Tap on the conversation button from home
   - Or directly navigate to `/conversation` route

2. **Start Recording**
   - Tap the large breathing Siani avatar
   - You'll feel haptic feedback (on device)
   - Avatar will show gold waves (listening state)
   - Waveform appears below avatar
   - Status shows "Listening..."

3. **Speak Your Message**
   - Speak clearly into your device's microphone
   - The waveform animates to show audio input
   - No time limit on recording

4. **Stop Recording**
   - Tap the avatar again
   - Recording stops automatically
   - Audio is transcribed (currently simulated)
   - Your message appears in the conversation

5. **Hear Siani's Response**
   - Siani processes your message
   - Avatar shows deep gold ring (speaking state)
   - Text-to-speech plays the response
   - Response message appears in conversation

### Permissions

The app will request microphone permissions on first use:

- **iOS**: "Allow Siani to access your microphone?"
- **Android**: "Allow Siani to record audio?"

Make sure to grant these permissions for voice features to work.

## 🎨 Components Usage

### Using SianiAvatar

```typescript
import SianiAvatar from "../components/SianiAvatar";

<SianiAvatar
  size={160}
  isListening={isRecording}
  isSpeaking={isSpeaking}
  onPress={handleAvatarPress}
/>
```

**Props:**
- `size?: number` - Avatar diameter (default: 120)
- `isListening?: boolean` - Shows listening state (gold waves)
- `isSpeaking?: boolean` - Shows speaking state (deep gold ring)
- `onPress?: () => void` - Callback when avatar is tapped
- `style?: any` - Custom styling

### Using WaveformVisualizer

```typescript
import WaveformVisualizer from "../components/WaveformVisualizer";

<WaveformVisualizer
  isActive={isRecording}
  type="listening"
/>
```

**Props:**
- `isActive: boolean` - Whether to show and animate
- `type: "listening" | "speaking"` - Animation speed and style

### Using VoiceCapture (Basic)

```typescript
import VoiceCapture from "../components/VoiceCapture";

<VoiceCapture
  onRecordingComplete={(uri) => {
    console.log("Audio recorded:", uri);
    // Send to transcription API
  }}
/>
```

**Props:**
- `onRecordingComplete?: (uri: string) => void` - Callback with audio file URI
- `style?: any` - Custom styling

## 🧠 Intelligence Features

### SDOH Detection

The conversation engine passively detects social determinants of health from natural conversation:

- **Housing**: "I'm struggling to pay rent", "My apartment is too cold"
- **Food**: "Can't afford groceries", "Food desert in my area"
- **Transportation**: "Bus never comes on time", "Can't get to appointments"
- **Financial**: "Behind on bills", "Can't make ends meet"

When detected, Siani:
1. Acknowledges with empathy
2. Waits for rapport to build
3. Offers relevant resources naturally
4. Never feels clinical or pushy

### Emotional Memory

Siani tracks:
- **Mood**: 13 emotional states (Joyful, Anxious, Hopeful, etc.)
- **Sentiment**: -1 (negative) to +1 (positive)
- **Triggers**: First mentions of important topics
- **Context**: What was happening during the conversation

View memories on the Feed screen as MemoryMomentCards.

### Rapport System

Rapport score (0-100) increases through:
- Regular conversations
- Sharing personal information
- Positive interactions
- Following up on resources

Higher rapport unlocks:
- More personal resource recommendations
- Proactive check-ins
- Deeper conversation topics

## 🎨 Luxury Theme

The app uses an "old money" aesthetic:

### Colors
- **Background**: `#F9F7F4` (warm off-white)
- **Surface**: `#FFFFFF` (pure white cards)
- **Text Primary**: `#1F1F1F` (deep charcoal)
- **Accent Gold**: `#DAA520` (classic gold)

### Typography
- **Font**: Inter (Regular, Medium, SemiBold)
- **Sizes**: xs(11) to xxxl(36)
- **Line Heights**: tight(1.2) to relaxed(1.75)

### Animations
- **Breathing**: 3s expand, 3s contract
- **Glow**: 2s fade in, 2s fade out
- **Fade In**: 600-800ms on mount

### Haptics
- **Light**: Subtle tap
- **Medium**: Standard press (avatar tap)
- **Heavy**: Important actions
- **Success/Warning/Error**: Notification types

## 🔧 Advanced Configuration

### Customizing Voice

In `conversation.tsx`, modify text-to-speech settings:

```typescript
Speech.speak(response, {
  rate: 0.9,  // Slightly slower (0.5 to 2.0)
  pitch: 1.0, // Neutral pitch (0.5 to 2.0)
  language: 'en-US',
});
```

### Customizing Avatar Animations

In `SianiAvatar.tsx`, adjust animation timings:

```typescript
// Breathing speed
duration: 3000, // milliseconds per phase

// Glow intensity
toValue: 0.4, // opacity (0.0 to 1.0)
```

### Customizing Waveform

In `WaveformVisualizer.tsx`, adjust bar animation:

```typescript
// Animation speed
duration: type === 'speaking' ? 400 : 600,

// Bar height range
toValue: 1,    // max height
toValue: 0.3,  // min height
```

## 📱 Testing Checklist

### On Web (Quick Testing)
- [ ] Conversation screen loads
- [ ] Avatar breathing animation works
- [ ] Click avatar shows listening state
- [ ] Message bubbles display correctly
- [ ] Theme colors are correct

### On iOS Device/Simulator
- [ ] Microphone permission requested
- [ ] Audio recording works
- [ ] Haptic feedback felt on avatar tap
- [ ] Text-to-speech plays
- [ ] Navigation smooth

### On Android Device/Emulator
- [ ] Audio permission requested
- [ ] Recording works
- [ ] Haptics work (if device supports)
- [ ] TTS works
- [ ] Theme renders correctly

## 🐛 Troubleshooting

### "Permission denied" for microphone
- Go to device Settings → Siani → Allow Microphone

### Audio recording not starting
- Check that `expo-av` is installed: `npm list expo-av`
- Restart the Expo dev server
- Check console for detailed error messages

### Text-to-speech not working
- Verify `expo-speech` is installed: `npm list expo-speech`
- On Android, ensure TTS engine is installed in system settings
- Check device volume is not muted

### Avatar not animating
- Check that fonts are loaded: `useFonts()` hook
- Verify animations use `useNativeDriver: true`
- Clear cache: `npx expo start --clear`

### TypeScript errors
- Run: `npx tsc --noEmit` to check all errors
- Ensure all dependencies are installed
- Check that types are imported correctly

### Backend not connecting
- Verify backend is running: `curl http://localhost:3000/health`
- For physical devices, use computer's IP address instead of localhost:
  ```bash
  # .env
  EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
  ```

## 📚 Next Steps

1. **Integrate Real Transcription**
   - Add OpenAI Whisper API key
   - Replace `simulateTranscription()` with real API call
   - Test with various audio inputs

2. **Add Backend Sync**
   - Implement `POST /api/voice/transcribe` endpoint
   - Save conversations to database
   - Sync memory moments

3. **Enhance UI**
   - Add bottom tab navigation
   - Create onboarding flow
   - Add notification system

4. **Test on Real Devices**
   - iOS: Use TestFlight for beta testing
   - Android: Use internal testing track
   - Gather user feedback

## 🎓 Resources

- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo Speech Documentation](https://docs.expo.dev/versions/latest/sdk/speech/)
- [Expo Haptics Documentation](https://docs.expo.dev/versions/latest/sdk/haptics/)
- [React Native Animated API](https://reactnative.dev/docs/animated)
- [MOBILE_SCAFFOLD_GUIDE.md](./MOBILE_SCAFFOLD_GUIDE.md) - Comprehensive guide
- [MOBILE_SCAFFOLD_CHECKLIST.md](../MOBILE_SCAFFOLD_CHECKLIST.md) - Implementation tracking

---

**"Not a helper — someone you aspire to be close to."**

🎙️ **Voice-first. Always listening. Never intrusive.**

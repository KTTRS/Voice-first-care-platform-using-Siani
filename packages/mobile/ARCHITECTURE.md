# 🏗️ Siani Mobile App Architecture

## Overview

This document provides a comprehensive overview of the Siani mobile app architecture, showing how voice capture, emotional intelligence, and luxury UI come together to create a voice-first conversational companion.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile App (React Native + Expo)         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  UI Layer    │  │  Logic Layer │  │  Data Layer  │          │
│  │              │  │              │  │              │          │
│  │ • Screens    │──│ • Engines    │──│ • API Client │          │
│  │ • Components │  │ • Memory     │  │ • Store      │          │
│  │ • Theme      │  │ • Detection  │  │ • Cache      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
├─────────────────────────────────────────────────────────────────┤
│  • Backend API (Node.js/Express)                                │
│  • OpenAI (Whisper for transcription, GPT for conversation)     │
│  • Voice Services (expo-av, expo-speech)                        │
│  • Local Storage (AsyncStorage for offline)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
packages/mobile/
├── app/                      # Screens (Expo Router)
│   ├── _layout.tsx          # Root layout with auth routing
│   ├── index.tsx            # Entry point (redirects to home)
│   ├── home.tsx             # Main screen with breathing avatar
│   ├── conversation.tsx     # Full-screen voice conversation ⭐
│   ├── feed.tsx             # Memory moments feed
│   ├── goals.tsx            # Goal tracking
│   ├── progress.tsx         # Progress visualization
│   ├── login.tsx            # Authentication
│   └── resource-assistant.tsx  # Resource discovery
│
├── components/              # Reusable UI components
│   ├── SianiAvatar.tsx     # Breathing avatar with states ⭐
│   ├── WaveformVisualizer.tsx  # Audio waveform display ⭐
│   ├── VoiceCapture.tsx    # Basic voice recording ⭐
│   ├── EmotionalVoiceCapture.tsx  # Voice + emotion
│   ├── MemoryMomentCard.tsx  # Emotional memory display
│   ├── ResourceCard.tsx    # Resource information
│   ├── ResourceOfferPrompt.tsx  # Resource offer modal
│   ├── EmotionAvatar.tsx   # Emotion-based avatar
│   ├── GlassmorphicButton.tsx  # Luxury button
│   ├── GlassmorphicCard.tsx    # Luxury card
│   └── GlassmorphicInput.tsx   # Luxury input
│
├── lib/                     # Business logic & services
│   ├── api.ts              # Backend API client
│   ├── conversationEngine.ts   # Main intelligence orchestration ⭐
│   ├── sianiMemory.ts      # Memory & mood tracking ⭐
│   ├── sdohCategories.ts   # SDOH detection patterns ⭐
│   ├── resourceEngine.ts   # Resource catalog & loops
│   ├── memoryVectorEngine.ts   # Vector embeddings & similarity
│   └── followUpEngine.ts   # Natural follow-up system
│
├── hooks/                   # Custom React hooks
│   └── useSDOHSync.ts      # SDOH data synchronization
│
├── store/                   # Global state management
│   └── emotionStore.ts     # Zustand store (user, goals, emotions)
│
├── theme/                   # Design system
│   └── luxury.ts           # Colors, typography, spacing ⭐
│
├── screens/                 # Legacy screens (being migrated to app/)
│   └── ProfileScreen.tsx   # User profile and settings
│
├── navigation/              # Navigation configuration
│   └── index.tsx           # Stack navigator setup
│
├── utils/                   # Utility functions
│   └── (various helpers)
│
└── assets/                  # Static assets
    ├── icon.png            # App icon (1024x1024)
    ├── splash.png          # Splash screen
    ├── adaptive-icon.png   # Android adaptive icon
    └── favicon.png         # Web favicon

⭐ = Core voice-first functionality
```

## Data Flow

### Voice Conversation Flow

```
User Interaction
      │
      ▼
┌─────────────┐
│ Tap Avatar  │ (SianiAvatar component)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Start Audio │ (expo-av requestPermissions)
│ Recording   │ (Audio.Recording.createAsync)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Show        │ (WaveformVisualizer animates)
│ Waveform    │ (Avatar shows listening state)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Tap Again   │ (Stop recording)
│ to Stop     │
└─────────────┘
      │
      ▼
┌─────────────┐
│ Transcribe  │ (Send to OpenAI Whisper API)
│ Audio       │ (Currently simulated)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Process     │ (conversationEngine.processMessage)
│ with AI     │ (Detect SDOH, mood, triggers)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Generate    │ (sianiMemory.analyzeMessage)
│ Response    │ (Check rapport, offer resources)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Speak       │ (expo-speech plays response)
│ Response    │ (Avatar shows speaking state)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Save Memory │ (Store in memoryVectorEngine)
│ Update Feed │ (Sync to backend API)
└─────────────┘
```

### Intelligence Pipeline

```
User Message (text)
      │
      ▼
┌──────────────────────┐
│ conversationEngine   │
│ .processMessage()    │
└──────────────────────┘
      │
      ├─────────────────────┐
      ▼                     ▼
┌──────────────┐    ┌──────────────┐
│ SDOH         │    │ Mood         │
│ Detection    │    │ Analysis     │
└──────────────┘    └──────────────┘
      │                     │
      ▼                     ▼
┌──────────────┐    ┌──────────────┐
│ Empathy      │    │ Sentiment    │
│ Response     │    │ Score        │
└──────────────┘    └──────────────┘
      │                     │
      └─────────┬───────────┘
                ▼
┌──────────────────────┐
│ Resource Decision    │
│ (based on rapport)   │
└──────────────────────┘
      │
      ├────────────┬──────────────┐
      ▼            ▼              ▼
┌──────────┐ ┌──────────┐  ┌──────────┐
│ Offer    │ │ Wait &   │  │ Pure     │
│ Resource │ │ Build    │  │ Empathy  │
└──────────┘ └──────────┘  └──────────┘
```

## Component Architecture

### SianiAvatar States

```
┌─────────────────────────────────────┐
│         SianiAvatar                 │
│                                     │
│  State: Idle                        │
│  • Breathing animation (6s cycle)  │
│  • Subtle glow pulse (4s cycle)    │
│  • Base color: #DAA520 (gold)      │
└─────────────────────────────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Listening│ │Speaking │ │ Error   │
│         │ │         │ │         │
│• Gold   │ │• Deep   │ │• Red    │
│  waves  │ │  gold   │ │  pulse  │
│• Active │ │  ring   │ │• Shake  │
│  pulse  │ │• Voice  │ │  anim   │
└─────────┘ └─────────┘ └─────────┘
```

### Conversation Screen Layout

```
┌─────────────────────────────────────┐
│           Status Bar                │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────┐         │
│    │   Siani Avatar      │         │
│    │   (160x160)         │         │
│    │   Breathing         │         │
│    └─────────────────────┘         │
│                                     │
│    ┌─────────────────────┐         │
│    │  WaveformVisualizer │         │
│    │  (when recording)   │         │
│    └─────────────────────┘         │
│                                     │
│    Status: "Listening..."           │
│                                     │
├─────────────────────────────────────┤
│   Message History (ScrollView)      │
│                                     │
│   ┌─────────────────────┐          │
│   │ User: "Hi Siani"    │→         │
│   └─────────────────────┘          │
│                                     │
│   ←┌─────────────────────┐         │
│    │ Siani: "Hey!"       │         │
│    └─────────────────────┘         │
│                                     │
│   ┌─────────────────────┐          │
│   │ User: "Feeling..."  │→         │
│   └─────────────────────┘          │
│                                     │
├─────────────────────────────────────┤
│    Instructions (first use)         │
│    "Tap Siani to start talking"    │
└─────────────────────────────────────┘
```

## State Management

### Global State (emotionStore.ts)

```typescript
interface EmotionStore {
  // User & Auth
  user: User | null;
  token: string | null;
  setToken: (token: string) => Promise<void>;
  
  // Goals
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  
  // Emotions & Memory
  currentEmotion: EmotionState;
  emotionHistory: EmotionState[];
  setEmotion: (emotion: EmotionState) => void;
  
  // Conversation State
  conversationId: string | null;
  conversationHistory: Message[];
  addMessage: (message: Message) => void;
  
  // Rapport & Trust
  rapportScore: number;
  updateRapport: (delta: number) => void;
}
```

### Local State (per screen)

Each screen maintains its own local state for UI:
- `conversation.tsx`: recording, speaking, messages
- `feed.tsx`: refreshing, loading, feed items
- `home.tsx`: modal visibility, resource offers

## API Integration

### Endpoints Used

```typescript
// Authentication
GET  /api/user              // Get current user
POST /api/auth/login        // Login with credentials

// Conversations
POST /api/voice/transcribe  // Transcribe audio to text
POST /api/conversations     // Create new conversation
GET  /api/conversations/:id // Get conversation history

// Memory & SDOH
POST /api/memoryMoments     // Save memory moment
GET  /api/memoryMoments     // Get memory feed
POST /api/sdoh/detect       // Detect SDOH from text

// Resources
GET  /api/resources         // Get resource catalog
POST /api/resources/accept  // Accept resource offer
POST /api/resources/decline // Decline resource offer

// Goals & Progress
GET  /api/goals             // Get user goals
POST /api/goals             // Create new goal
PUT  /api/goals/:id         // Update goal progress

// Feed
GET  /api/feed              // Get activity feed
POST /api/feed/event        // Create feed event
```

### API Client (lib/api.ts)

```typescript
// Base configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const client = axios.create({ baseURL: API_URL });

// Authentication
export const setToken = async (token: string) => {
  await AsyncStorage.setItem('auth_token', token);
  client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Example usage
export const transcribeAudio = async (audioUri: string) => {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  });
  
  const response = await client.post('/api/voice/transcribe', formData);
  return response.data.text;
};
```

## Intelligence Engines

### conversationEngine.ts

Main orchestrator for conversation intelligence:

```typescript
export async function processMessage(
  userMessage: string,
  userId: string,
  conversationId?: string
): Promise<ConversationResponse> {
  // 1. Detect SDOH categories
  const sdohDetection = detectSDOH(userMessage);
  
  // 2. Analyze mood and sentiment
  const mood = sianiMemory.analyzeMessage(userMessage, userId);
  
  // 3. Check rapport score
  const rapport = await getRapportScore(userId);
  
  // 4. Generate empathy response
  let response = generateEmpathyResponse(mood, sdohDetection);
  
  // 5. Offer resource if appropriate
  if (shouldOfferResource(sdohDetection, rapport)) {
    const resource = await findBestResource(sdohDetection);
    response += `\n\n${resource.sianiIntro}`;
  }
  
  // 6. Save memory moment
  await memoryVectorStore.addMemory({
    text: userMessage,
    mood: mood.currentMood,
    timestamp: new Date(),
  });
  
  return { text: response, mood, sdohDetection, resource };
}
```

### sianiMemory.ts

Tracks emotional context and builds rapport:

```typescript
export const sianiMemory = {
  analyzeMessage(text: string, userId: string): MoodAnalysis {
    // Detect mood from text patterns
    const mood = detectMood(text);
    const sentiment = calculateSentiment(text);
    const triggers = detectTriggers(text, userId);
    
    return { currentMood: mood, sentiment, triggers };
  },
  
  updateRapport(userId: string, interaction: Interaction) {
    // Increase rapport based on:
    // - Sharing personal info (+5)
    // - Accepting resource (+10)
    // - Regular check-ins (+2)
    // - Positive sentiment (+3)
  },
};
```

### sdohCategories.ts

Passive detection of social determinants:

```typescript
export const sdohCategories = {
  HOUSING: {
    keywords: ['rent', 'eviction', 'homeless', 'apartment'],
    patterns: [/can't afford.*rent/i, /behind on.*mortgage/i],
    empathyResponse: "That sounds really stressful...",
  },
  FOOD: {
    keywords: ['hungry', 'groceries', 'food bank'],
    patterns: [/can't.*afford.*food/i, /skip.*meals/i],
    empathyResponse: "I hear you. Food security is so important...",
  },
  // ... more categories
};
```

## Performance Optimizations

### React Native Optimizations

1. **Use Native Driver for Animations**
   ```typescript
   Animated.timing(value, {
     useNativeDriver: true, // Runs on native thread
   });
   ```

2. **Memoize Components**
   ```typescript
   const MemoizedAvatar = React.memo(SianiAvatar);
   ```

3. **Lazy Load Screens**
   ```typescript
   const ConversationScreen = lazy(() => import('./conversation'));
   ```

### Audio Optimizations

1. **High Quality Recording**
   ```typescript
   Audio.RecordingOptionsPresets.HIGH_QUALITY
   // Sample rate: 44100 Hz
   // Bit rate: 128000 bps
   ```

2. **Streaming Transcription** (future)
   ```typescript
   // Send audio chunks as they're recorded
   // Instead of waiting for full recording
   ```

## Security Considerations

### Token Storage

```typescript
// Use encrypted storage
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('auth_token', token);
const token = await SecureStore.getItemAsync('auth_token');
```

### Audio Privacy

- Audio files stored temporarily
- Deleted after transcription
- Never stored on device long-term
- User consent required

### Data Encryption

- All API calls use HTTPS
- Tokens never logged
- Sensitive data encrypted at rest

## Testing Strategy

### Unit Tests

```typescript
// Test intelligence engines
describe('conversationEngine', () => {
  test('detects SDOH categories', () => {
    const result = detectSDOH("I can't afford rent");
    expect(result.category).toBe('HOUSING');
  });
});
```

### Integration Tests

```typescript
// Test full conversation flow
describe('Conversation Flow', () => {
  test('records audio and transcribes', async () => {
    const uri = await recordAudio();
    const text = await transcribeAudio(uri);
    expect(text).toBeTruthy();
  });
});
```

### E2E Tests (future)

- Use Detox for end-to-end testing
- Test on real devices
- Simulate user journeys

## Deployment

### iOS

1. Build with EAS Build
   ```bash
   eas build --platform ios
   ```

2. Submit to TestFlight
   ```bash
   eas submit --platform ios
   ```

### Android

1. Build APK/AAB
   ```bash
   eas build --platform android
   ```

2. Submit to Google Play
   ```bash
   eas submit --platform android
   ```

## Future Enhancements

### Short Term
- [ ] Real OpenAI Whisper integration
- [ ] Backend API sync for conversations
- [ ] Offline mode with queue
- [ ] Push notifications for follow-ups

### Medium Term
- [ ] Multi-language support
- [ ] Voice customization (pitch, rate, voice)
- [ ] Conversation export (PDF, email)
- [ ] Advanced analytics

### Long Term
- [ ] Real-time streaming transcription
- [ ] Voice cloning for Siani
- [ ] Emotion detection from voice tone
- [ ] AR avatar integration

## Resources

### Documentation
- [VOICE_QUICKSTART.md](./VOICE_QUICKSTART.md) - Getting started
- [MOBILE_SCAFFOLD_GUIDE.md](./MOBILE_SCAFFOLD_GUIDE.md) - Complete guide
- [README.md](./README.md) - Project overview

### External Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

---

**Architecture Last Updated**: 2024-11-10
**Version**: 1.0.0

# 🎨 Siani Mobile UI Scaffold - Complete Guide

## Overview

**Siani Mobile** is a voice-first conversational companion app built with React Native and Expo. The app embodies an "old money" aesthetic - subtle luxury, timeless elegance, and personal connection.

### Design Philosophy

```
"Not a health app. A companion you aspire to be close to."
```

- **Voice-First**: Speech is primary, text is secondary
- **Always Present**: Siani avatar is ever-visible, breathing, aware
- **Subtle Luxury**: Old money aesthetic - elevated, not flashy
- **Emotionally Intelligent**: Passive SDOH detection, emotional memory, rapport building
- **Non-Clinical**: Feels cultural and personal, not medical

---

## 📁 Project Structure

```
packages/mobile/
├── app/                          # Screens (Expo Router)
│   ├── _layout.tsx              # Root layout with auth routing
│   ├── index.tsx                # Redirect to home
│   ├── home.tsx                 # Luxury voice-first home (breathing avatar)
│   ├── conversation.tsx         # Full-screen voice conversation
│   ├── feed.tsx                 # Memory feed with luxury styling
│   ├── goals.tsx                # Goal tracking
│   ├── login.tsx                # Authentication
│   ├── progress.tsx             # Progress tracking
│   └── resource-assistant.tsx   # Resource discovery
│
├── components/                   # Reusable UI components
│   ├── SianiAvatar.tsx          # Breathing avatar with animations
│   ├── WaveformVisualizer.tsx   # Audio waveform display
│   ├── MemoryMomentCard.tsx     # Emotional memory card
│   ├── ResourceCard.tsx         # Resource display card
│   └── ResourceOfferPrompt.tsx  # Resource offer modal
│
├── lib/                          # Business logic & services
│   ├── api.ts                   # Backend API client
│   ├── conversationEngine.ts    # Main intelligence orchestration
│   ├── sianiMemory.ts           # Memory & mood tracking
│   ├── sdohCategories.ts        # SDOH detection patterns
│   ├── resourceEngine.ts        # Resource catalog & loops
│   ├── memoryVectorEngine.ts    # Vector embeddings & similarity
│   └── followUpEngine.ts        # Natural follow-up system
│
├── hooks/                        # Custom React hooks
│   └── useSDOHSync.ts           # SDOH data synchronization
│
└── theme/                        # Design system
    └── luxury.ts                # Colors, typography, spacing
```

---

## 🎨 Design System (Old Money Aesthetic)

### Color Palette

```typescript
// Background & Surfaces
background: "#F9F7F4"    // Off-white with warm undertone
surface: "#FFFFFF"       // Pure white for elevated cards

// Text Hierarchy
text.primary: "#1F1F1F"     // Deep charcoal (not pure black)
text.secondary: "#4A4540"   // Warm gray
text.tertiary: "#6B6560"    // Muted brown-gray

// Accent (Rare Gold Touches)
accent.gold: "#DAA520"      // Classic gold
accent.deepGold: "#B8860B"  // Dark goldenrod

// Borders
border.light: "#E8E3D9"
border.medium: "#D4CFC4"
```

### Typography

```typescript
fonts: {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
}

sizes: {
  xs: 11,   // Tags, timestamps
  sm: 13,   // Captions
  base: 16, // Body text
  lg: 18,   // Subheadings
  xl: 22,   // Headings
  xxl: 28,  // Page titles
}
```

### Animations

- **Breathing**: 6-second cycle (3s expand, 3s contract)
- **Glow**: 4-second pulse (subtle ambient effect)
- **Active Pulse**: 1.2-second cycle when listening/speaking
- **Fade In**: 600-800ms on screen entry

---

## 🧩 Core Components

### 1. SianiAvatar

**Purpose**: The ever-present conversational companion

**Features**:

- Gentle breathing animation (3s cycle)
- Subtle glow pulse (ambient awareness)
- Active state (listening: gold waves, speaking: deep gold ring)
- Haptic feedback on press
- Size customizable (default 120px)

**Usage**:

```tsx
<SianiAvatar
  size={160}
  isListening={isListening}
  isSpeaking={isSpeaking}
  onPress={handleAvatarPress}
/>
```

**States**:

- **Idle**: Slow breathing, subtle glow
- **Listening**: Faster pulse, gold glow, waveform bars
- **Speaking**: Deep gold pulse, animated ring

---

### 2. WaveformVisualizer

**Purpose**: Visual audio feedback during conversations

**Features**:

- 5-bar animated waveform
- Different speeds for listening vs speaking
- Gold color scheme matching Siani brand
- Status text ("Listening..." / "Speaking...")

**Usage**:

```tsx
<WaveformVisualizer
  isActive={isListening || isSpeaking}
  type={isListening ? "listening" : "speaking"}
/>
```

---

### 3. MemoryMomentCard

**Purpose**: Display captured conversation moments with emotional context

**Features**:

- 13 mood types with emojis and colors
- Sentiment visualization (-1 to 1 scale)
- Tags for SDOH categories
- Time formatting ("Just now", "2h ago", "3d ago")
- Luxury card styling (off-white, borders, shadows)

**Usage**:

```tsx
<MemoryMomentCard
  moment={{
    text: "I've been feeling overwhelmed lately",
    mood: "overwhelmed",
    sentiment: -0.6,
    timestamp: new Date(),
    tags: ["work", "stress"],
  }}
/>
```

**Mood Colors**:

- Positive: hopeful 🌟, grateful 🙏, relieved 😌, content 😊
- Negative: overwhelmed 😰, anxious 😟, frustrated 😤, stressed 😓
- Neutral: neutral 😐

---

### 4. ResourceCard & ResourceOfferPrompt

**Purpose**: Display and offer resources with Siani's natural voice

**Features**:

- Resource catalog (food, transportation, housing, etc.)
- "Accept" / "Decline" flows
- Contact info display (phone, website)
- Siani's custom intro text
- Luxury modal styling

---

## 📱 Screens

### Home Screen (`home.tsx`)

**Current Implementation**:

- Breathing Siani avatar (center)
- Voice message bubbles (luxury styling)
- Resource offer modal (gold accents)
- Full intelligence integration (SDOH detection, memory, follow-ups)

**Key Features**:

- Tap avatar to speak
- Messages sync to backend
- Resource offers appear when rapport allows
- Follow-ups trigger naturally

**Navigation**:

- "View Feed" → Feed screen
- "My Goals" → Goals screen
- "Resources" → Resource Assistant

---

### Conversation Screen (`conversation.tsx`)

**NEW - Just Created**

**Layout**:

```
┌────────────────────────┐
│  Header: "Siani"       │
│  "Tap to talk"         │
├────────────────────────┤
│                        │
│  Message Bubbles       │
│  (scrollable)          │
│                        │
├────────────────────────┤
│  Waveform Visualizer   │
│  (when active)         │
├────────────────────────┤
│                        │
│    Siani Avatar        │
│    (large, centered)   │
│                        │
│  "Tap to start"        │
└────────────────────────┘
```

**Interaction Flow**:

1. User taps avatar
2. Haptic feedback + audio recording starts
3. Waveform animates (listening mode)
4. User stops recording
5. Audio sent to backend for transcription
6. Siani responds with voice + text
7. Waveform animates (speaking mode)

**Current State**:

- ✅ UI complete
- ✅ Voice recording (expo-av)
- ✅ Text-to-speech (expo-speech)
- ⏳ Needs: Backend transcription API integration

---

### Feed Screen (`feed.tsx`)

**Just Updated with Luxury Styling**

**Features**:

- Pull-to-refresh (gold loading indicator)
- Feed cards with luxury styling
- Event types: GOAL_CREATED, GOAL_COMPLETED, DAILY_ACTION, STREAK, etc.
- Color-coded emoji indicators
- Relative timestamps
- Empty state with elegant message

**Card Types**:

- 🎯 Goal Created (blue)
- 🏆 Goal Completed (green)
- ✅ Daily Action (light green)
- 🔥 Streak Maintained (orange)
- 💭 Memory Moment (cyan)
- 🎉 Milestone (gold)

---

## 🎙️ Voice Integration

### Current Implementation

**Audio Recording**:

```typescript
import { Audio } from "expo-av";

// Request permissions
await Audio.requestPermissionsAsync();

// Start recording
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);

// Stop recording
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
// Send to backend for transcription
```

**Text-to-Speech**:

```typescript
import * as Speech from "expo-speech";

Speech.speak("Hey, I'm listening.", {
  language: "en-US",
  pitch: 1.0,
  rate: 0.9, // Slightly slower for warmth
});
```

### TODO: Transcription API

**Option 1: OpenAI Whisper**

```typescript
const formData = new FormData();
formData.append("file", {
  uri: audioUri,
  type: "audio/m4a",
  name: "recording.m4a",
});

const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  },
  body: formData,
});

const { text } = await response.json();
```

**Option 2: Google Speech-to-Text**

```typescript
const response = await fetch(
  `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
  {
    method: "POST",
    body: JSON.stringify({
      audio: { content: base64Audio },
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: "en-US",
      },
    }),
  }
);
```

---

## 🧠 Intelligence System Integration

### Passive SDOH Detection

```typescript
import { processMessage } from "../lib/conversationEngine";

const response = await processMessage(
  userId,
  "I've been missing work because the bus keeps not showing up",
  conversationId
);

// Response includes:
// - reply: Empathetic response
// - sdohDetection: { category: "CARE_BARRIERS", subcategory: "transportation" }
// - resourceOffer: { shouldOffer: true, resource: {...}, offerText: "..." }
// - memoryMoment: Stored with mood, sentiment, rapport
```

### Memory & Emotional Context

```typescript
import { sianiMemory } from "../lib/sianiMemory";

sianiMemory.setUserId(userId);
const moment = sianiMemory.addMoment(
  "I'm so stressed about everything",
  conversationId
);

// moment includes:
// - mood: "overwhelmed"
// - sentiment: -0.6
// - trigger: { topic: "work", isFirstMention: true }
// - rapportScore: 67
```

### Vector Similarity Search

```typescript
import { memoryVectorStore } from "../lib/memoryVectorEngine";

const similar = await memoryVectorStore.searchSimilarMoments(
  userId,
  currentMoment,
  3, // topK
  0.7 // minSimilarity
);

// Returns past moments with emotional parallels
// "I remember you felt like this 12 days ago..."
```

---

## 🔧 Setup & Installation

### 1. Install Dependencies

```bash
cd packages/mobile
npm install
```

**Packages Installed**:

- `expo` ~49.0.15
- `expo-av` ~13.4.1 (audio recording)
- `expo-speech` ~11.3.0 (text-to-speech)
- `expo-haptics` ~12.4.0 (tactile feedback)
- `expo-font` ~11.4.0 (Inter fonts)
- `@expo-google-fonts/inter`
- `@react-native-async-storage/async-storage` (token storage)
- `axios` (API client)
- `react-native` 0.72.10
- `typescript` ^5.1.3

### 2. Configure Environment

Create `.env`:

```
API_URL=http://localhost:3000
OPENAI_API_KEY=sk-...       # For embeddings & transcription
```

### 3. Run Development Server

```bash
npm run dev
```

**Options**:

- `npm run android` - Android emulator/device
- `npm run ios` - iOS simulator (Mac only)
- `npm run web` - Web browser

---

## 📐 Screen Layout Specs

### Home Screen Dimensions

```
Avatar Size: 120px (mobile), 160px (conversation)
Message Bubble Max Width: 80% of screen
Padding: 20px (edges), 12px (between elements)
Font Sizes: 16px (body), 22px (title), 13px (caption)
```

### Color Usage

```
Background: #F9F7F4 (all screens)
Cards: #FFFFFF with 1px #E8E3D9 border
Primary Text: #1F1F1F
Gold Accent: #DAA520 (avatar glow, active states, loading)
Shadows: rgba(0, 0, 0, 0.08) - 8px blur
```

### Animation Timings

```
Breathing: 3000ms (ease-in-out)
Glow Pulse: 2000ms (ease-in-out)
Active Pulse: 600ms (when listening/speaking)
Fade In: 600-800ms
Button Press: 200ms
```

---

## 🎯 Development Roadmap

### ✅ Phase 1: Core UI (COMPLETE)

- [x] SianiAvatar component with breathing animation
- [x] WaveformVisualizer for audio feedback
- [x] MemoryMomentCard for emotional context
- [x] Luxury theme system (colors, typography, spacing)
- [x] Conversation screen layout
- [x] Feed screen with luxury styling
- [x] Home screen with intelligence integration

### ⏳ Phase 2: Voice Integration (IN PROGRESS)

- [x] Audio recording (expo-av)
- [x] Text-to-speech (expo-speech)
- [ ] Backend transcription API (OpenAI Whisper or Google STT)
- [ ] Real-time waveform from mic input
- [ ] Voice activity detection (auto-stop when silent)
- [ ] Background audio handling

### 📋 Phase 3: Intelligence Features (NEXT)

- [ ] Replace simulated transcription with real API
- [ ] Configure OpenAI embeddings for vector search
- [ ] Implement backend memory sync endpoints
- [ ] Resource catalog expansion (50+ resources)
- [ ] Push notifications for follow-ups
- [ ] Offline mode with local storage

### 🚀 Phase 4: Polish & Launch

- [ ] User onboarding flow
- [ ] Privacy consent & data deletion
- [ ] HIPAA compliance (if health data)
- [ ] A/B testing for rapport thresholds
- [ ] Analytics dashboard integration
- [ ] App Store submission

---

## 🧪 Testing Scenarios

### Scenario 1: First Conversation

1. Open app → See breathing Siani avatar
2. Read: "Tap Siani to start a conversation"
3. Tap avatar → Haptic feedback
4. See waveform animation (listening)
5. Speak: "I've been feeling really stressed"
6. Tap again to stop
7. Siani responds: "Ugh, that sounds tough. Want to talk about it?"
8. Voice output plays
9. Message appears in conversation

### Scenario 2: SDOH Detection

1. Start conversation
2. Say: "I've been missing work because the bus keeps not showing up"
3. Siani detects: transportation barrier (confidence 0.85)
4. Empathy response: "Ugh the bus situation sounds so frustrating"
5. After 2 seconds, resource offer appears (if rapport > 50)
6. Modal shows: "Free Medical Rides Program"
7. User taps "Yes, send it to me"
8. Contact info displayed
9. Follow-up scheduled for Day 3

### Scenario 3: Memory Reference

1. Previous conversation: "I feel overwhelmed" (12 days ago)
2. Current conversation: "Everything is so stressful"
3. Vector similarity search finds past moment (similarity 0.82)
4. Siani says: "I remember you felt something like this a couple weeks back. Has anything changed?"
5. Shows emotional awareness, not just keyword matching

### Scenario 4: Feed Browse

1. Navigate to Feed screen
2. Pull to refresh (gold loading indicator)
3. See cards:
   - 🎯 "Created goal: Exercise 3x per week" (2h ago)
   - ✅ "Completed daily action: Morning walk" (1d ago)
   - 💭 "Memory moment: Feeling hopeful" (3d ago)
4. Scroll smooth with fade-in animations
5. Empty state if no activities: "No activities yet!"

---

## 🔌 Backend API Integration

### Required Endpoints

**Memory Sync**:

```
POST /api/memoryMoments
GET /api/memoryMoments?userId=...
POST /api/memoryVectors
POST /api/memoryVectors/search
```

**Resource Loops**:

```
POST /api/referralLoops
GET /api/referralLoops?userId=...&loopClosed=false
PATCH /api/referralLoops/:id
```

**Conversation**:

```
POST /api/conversations
POST /api/conversations/:id/messages
```

**Voice**:

```
POST /api/voice/transcribe (multipart/form-data with audio file)
POST /api/voice/synthesize (text → audio URL)
```

### Authentication

```typescript
import { getToken } from "../lib/api";

const token = await getToken(); // From AsyncStorage

const response = await fetch(`${API_URL}/api/endpoint`, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

---

## 🎨 Customization Guide

### Change Color Palette

Edit `theme/luxury.ts`:

```typescript
export const colors = {
  background: "#YOUR_BG_COLOR",
  accent: {
    gold: "#YOUR_ACCENT_COLOR",
  },
};
```

### Add New Mood Type

Edit `components/MemoryMomentCard.tsx`:

```typescript
const moodColors: Record<string, string> = {
  // ... existing moods
  excited: "#FF6B6B", // Your new mood
};

const moodEmojis: Record<string, string> = {
  // ... existing moods
  excited: "🤩",
};
```

### Add New SDOH Category

Edit `lib/sdohCategories.ts`:

```typescript
export const SDOH_INDICATORS = [
  // ... existing categories
  {
    category: "YOUR_CATEGORY",
    subcategory: "your_subcategory",
    patterns: ["pattern 1", "pattern 2"],
    severity: "medium",
    confidence: 0.75,
    responseStrategy: "wait_for_rapport",
  },
];
```

### Add New Resource

Edit `lib/resourceEngine.ts`:

```typescript
export const RESOURCE_CATALOG: Resource[] = [
  // ... existing resources
  {
    id: "new_resource_id",
    category: "BASIC_NEEDS",
    subcategory: "food",
    title: "Your Resource Title",
    description: "What it does",
    contactInfo: {
      phone: "1-800-XXX-XXXX",
      website: "https://...",
    },
    sianiIntro: "Hey, totally random, but I saw this thing...",
  },
];
```

---

## 🐛 Troubleshooting

### Audio Recording Not Working

**Issue**: Permission denied or recording fails

**Solutions**:

```bash
# iOS: Add to Info.plist
<key>NSMicrophoneUsageDescription</key>
<string>Siani needs microphone access to hear you</string>

# Android: Add to AndroidManifest.xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Fonts Not Loading

**Issue**: "Font is not loaded" error

**Solution**:

```typescript
const [fontsLoaded] = useFonts({
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
});

if (!fontsLoaded) {
  return null; // Wait for fonts
}
```

### TypeScript Errors

**Issue**: Import errors for theme

**Solution**:

```bash
# Restart TypeScript server
Cmd+Shift+P → "TypeScript: Restart TS Server"

# Check tsconfig.json includes:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Backend Connection Failed

**Issue**: "Network request failed"

**Solutions**:

```typescript
// Check .env file exists
API_URL=http://localhost:3000

// For Android emulator, use:
API_URL=http://10.0.2.2:3000

// For iOS simulator, use:
API_URL=http://localhost:3000

// For physical device, use your computer's IP:
API_URL=http://192.168.1.XXX:3000
```

---

## 📚 Libraries Reference

### Expo Modules

- **expo-av**: Audio recording, playback
- **expo-speech**: Text-to-speech synthesis
- **expo-haptics**: Tactile feedback
- **expo-font**: Custom font loading
- **expo-router**: File-based navigation

### React Native Core

- **Animated**: Declarative animations
- **StyleSheet**: Component styling
- **Platform**: OS-specific code
- **Dimensions**: Screen size detection

### Third Party

- **@expo-google-fonts/inter**: Inter font family
- **@react-native-async-storage**: Token persistence
- **axios**: HTTP client

---

## 🏆 Success Metrics

### User Engagement

- **Daily Active Users**: % of users who open app daily
- **Conversation Duration**: Average time in conversation screen
- **Messages Per Session**: Depth of conversations
- **Return Rate**: % who return after first conversation

### Intelligence Accuracy

- **SDOH Detection Rate**: % of conversations with SDOH flags
- **Resource Acceptance**: % of offers accepted
- **Loop Closure Rate**: % of resources engaged within 14 days
- **Rapport Growth**: Average rapport score over time

### Technical Performance

- **Audio Recording Success**: % of successful recordings
- **Transcription Accuracy**: Word error rate
- **API Response Time**: <500ms for message processing
- **Crash Rate**: <1% of sessions

---

## 🌟 Next Steps

### Immediate (This Week)

1. **Test conversation screen** with real users
2. **Integrate transcription API** (OpenAI Whisper or Google)
3. **Configure OpenAI embeddings** for vector search
4. **Expand resource catalog** to 20+ resources

### Short-Term (This Month)

1. **Build onboarding flow** (3-screen intro)
2. **Add push notifications** for follow-ups
3. **Implement offline mode** with local storage
4. **Create analytics dashboard** for metrics

### Long-Term (This Quarter)

1. **A/B test rapport thresholds** (optimize acceptance rate)
2. **Add ML-based SDOH detection** (replace pattern matching)
3. **Build CMS for resources** (admin panel)
4. **Launch beta program** (100 users)

---

## 📞 Support

**Documentation**:

- Architecture: `SIANI_INTELLIGENCE_COMPLETE.md`
- Quick Reference: `SIANI_INTELLIGENCE_QUICKREF.md`
- Implementation Summary: `SIANI_IMPLEMENTATION_SUMMARY.md`

**Code Reference**:

- SianiAvatar: `components/SianiAvatar.tsx`
- Conversation Engine: `lib/conversationEngine.ts`
- Theme System: `theme/luxury.ts`

**Testing**:

```bash
cd packages/mobile
npm run dev
# Scan QR code with Expo Go app
```

---

**"Not a helper — someone you aspire to be close to."**

🎉 **Mobile scaffold complete!**

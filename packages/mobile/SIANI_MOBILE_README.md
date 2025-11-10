# 🎨 Siani Mobile - Voice-First Companion App

## Overview

Siani Mobile is a **voice-first conversational companion** built with React Native and Expo. The app embodies an "old money" aesthetic - subtle luxury, timeless elegance, and deep personal connection.

```
"Not a health app. A companion you aspire to be close to."
```

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SIANI MOBILE APP                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Home Screen │  │ Conversation │  │  Feed Screen │     │
│  │              │  │    Screen    │  │              │     │
│  │ • Avatar     │  │ • Voice UI   │  │ • Memories   │     │
│  │ • Messages   │  │ • Waveform   │  │ • Events     │     │
│  │ • Resources  │  │ • Recording  │  │ • Goals      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│         ┌──────────────────┴────────────────┐              │
│         │                                    │              │
│  ┌──────▼─────────┐              ┌──────────▼──────────┐   │
│  │  UI Components │              │  Intelligence System │   │
│  │                │              │                      │   │
│  │ • SianiAvatar  │              │ • conversationEngine │   │
│  │ • Waveform     │              │ • sianiMemory        │   │
│  │ • MemoryCard   │              │ • sdohCategories     │   │
│  │ • ResourceCard │              │ • resourceEngine     │   │
│  └────────────────┘              │ • vectorEngine       │   │
│                                  │ • followUpEngine     │   │
│                                  └──────────┬───────────┘   │
│                                             │               │
│                                  ┌──────────▼───────────┐   │
│                                  │    API Client        │   │
│                                  │                      │   │
│                                  │ • fetchAPI()         │   │
│                                  │ • syncData()         │   │
│                                  │ • AsyncStorage       │   │
│                                  └──────────┬───────────┘   │
└─────────────────────────────────────────────┼───────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Backend API     │
                                    │ localhost:3000  │
                                    └─────────────────┘
```

---

## 🎨 Design System (Old Money Aesthetic)

### Color Palette

```typescript
Background:  #F9F7F4  // Off-white with warm undertone
Surface:     #FFFFFF  // Pure white for elevated cards
Text:        #1F1F1F  // Deep charcoal (not pure black)
Gold Accent: #DAA520  // Classic gold (rare touches)
Borders:     #E8E3D9  // Light beige
```

### Typography

```typescript
Font Family: Inter (400, 500, 600)
Sizes:       11px (xs) → 36px (xxxl)
Spacing:     Subtle letter-spacing for elegance
Hierarchy:   Clear visual hierarchy
```

### Animations

- **Breathing**: 6-second cycle (slow, calming)
- **Glow**: 4-second pulse (ambient awareness)
- **Active**: 1.2-second pulse (listening/speaking)
- **Fade In**: 600-800ms (screen transitions)

---

## 🧩 Component Library

### SianiAvatar

**Purpose**: Ever-present conversational companion

**Features**:

- Breathing animation (3s expand, 3s contract)
- Subtle glow pulse
- Active states (listening: gold waves, speaking: deep gold ring)
- Haptic feedback on press
- Customizable size (default 120px)

**Usage**:

```tsx
<SianiAvatar
  size={160}
  isListening={isRecording}
  isSpeaking={isSianiSpeaking}
  onPress={handleAvatarPress}
/>
```

---

### WaveformVisualizer

**Purpose**: Visual audio feedback

**Features**:

- 5-bar animated waveform
- Different speeds for listening vs speaking
- Gold color scheme
- Status text ("Listening..." / "Speaking...")

**Usage**:

```tsx
<WaveformVisualizer
  isActive={isListening || isSpeaking}
  type={isListening ? "listening" : "speaking"}
/>
```

---

### MemoryMomentCard

**Purpose**: Display emotional conversation moments

**Features**:

- 13 mood types with emojis (😰 😌 🌟 😓 etc.)
- Sentiment visualization (-1 to 1 scale)
- SDOH tags
- Relative time formatting
- Luxury card styling

**Usage**:

```tsx
<MemoryMomentCard
  moment={{
    text: "I've been feeling overwhelmed",
    mood: "overwhelmed",
    sentiment: -0.6,
    timestamp: new Date(),
    tags: ["work", "stress"],
  }}
/>
```

---

## 📱 Screens

### Home Screen (`home.tsx`)

**Current**: Fully integrated with intelligence system

**Features**:

- Breathing Siani avatar
- Voice message bubbles (luxury styling)
- Resource offer modal
- SDOH detection
- Memory storage
- Follow-up scheduling

**Flow**:

1. Tap avatar → Record voice
2. processMessage() → Detect SDOH, store memory
3. Show empathy response
4. Offer resource (if rapport allows)
5. Follow up naturally (Day 3, 7, 14)

---

### Conversation Screen (`conversation.tsx`)

**NEW**: Full-screen voice-first experience

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
└────────────────────────┘
```

**Features**:

- Audio recording (expo-av)
- Text-to-speech (expo-speech)
- Waveform animation
- Message bubbles (user + Siani)
- Haptic feedback
- Auto-scroll to latest message

**Status**: ✅ UI complete, ⏳ Needs transcription API

---

### Feed Screen (`feed.tsx`)

**UPDATED**: Luxury styling applied

**Features**:

- Pull-to-refresh (gold loading indicator)
- Feed cards with luxury design
- Event types: 🎯 GOAL, ✅ ACTION, 💭 MEMORY, 🔥 STREAK
- Color-coded emoji indicators
- Relative timestamps
- Empty state messaging

---

## 🎙️ Voice Integration

### Current Implementation

**Audio Recording** (expo-av):

```tsx
// Start recording
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);

// Stop recording
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

**Text-to-Speech** (expo-speech):

```tsx
Speech.speak("Hey, I'm listening.", {
  language: "en-US",
  pitch: 1.0,
  rate: 0.9, // Slightly slower for warmth
});
```

### Next Step: Transcription

**OpenAI Whisper** (recommended):

```tsx
const formData = new FormData();
formData.append("file", { uri, type: "audio/m4a", name: "recording.m4a" });

const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
  method: "POST",
  headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  body: formData,
});

const { text } = await response.json();
```

---

## 🧠 Intelligence System

### Passive SDOH Detection

```tsx
import { processMessage } from "../lib/conversationEngine";

const response = await processMessage(
  userId,
  "I've been missing work because the bus keeps not showing up",
  conversationId
);

// Response:
// {
//   reply: "Ugh the bus situation sounds so frustrating",
//   sdohDetection: {
//     category: "CARE_BARRIERS",
//     subcategory: "transportation",
//     confidence: 0.85
//   },
//   resourceOffer: {
//     shouldOffer: true,
//     resource: { title: "Free Medical Rides", ... },
//     offerText: "Totally random, but I saw this thing..."
//   }
// }
```

### Memory & Emotional Context

```tsx
import { sianiMemory } from "../lib/sianiMemory";

const moment = sianiMemory.addMoment("I'm so stressed", conversationId);

// moment includes:
// - mood: "stressed" (13 types)
// - sentiment: -0.6 (-1 to 1)
// - trigger: { topic: "work", isFirstMention: true }
// - rapportScore: 67 (0-100)
```

### Vector Similarity Search

```tsx
import { memoryVectorStore } from "../lib/memoryVectorEngine";

const similar = await memoryVectorStore.searchSimilarMoments(
  userId,
  currentMoment,
  3, // topK
  0.7 // minSimilarity
);

// Returns past moments with emotional parallels:
// "I remember you felt something like this a couple weeks back..."
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd packages/mobile
npm install
```

### 2. Configure Environment

Create `.env`:

```
API_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
```

### 3. Start Development Server

**Quick Start**:

```bash
./start-mobile-scaffold.sh
```

**Manual**:

```bash
npm run dev
```

### 4. Run on Device

- **iOS Simulator** (Mac): Press `i`
- **Android Emulator**: Press `a`
- **Physical Device**: Scan QR code with Expo Go
- **Web**: Press `w`

---

## 📁 Project Structure

```
packages/mobile/
├── app/                          # Screens (Expo Router)
│   ├── home.tsx                 ✅ Voice-first home (694 lines)
│   ├── conversation.tsx         ✅ NEW Full-screen voice (380 lines)
│   ├── feed.tsx                 ✅ UPDATED Luxury feed (310 lines)
│   ├── login.tsx                ✅ Authentication
│   ├── goals.tsx                ✅ Goal tracking
│   └── _layout.tsx              ✅ UPDATED Navigation
│
├── components/                   # UI Components
│   ├── SianiAvatar.tsx          ✅ NEW Breathing avatar (350 lines)
│   ├── WaveformVisualizer.tsx   ✅ NEW Audio feedback (220 lines)
│   ├── MemoryMomentCard.tsx     ✅ NEW Memory display (260 lines)
│   ├── ResourceCard.tsx         ✅ Resource display
│   └── ResourceOfferPrompt.tsx  ✅ Resource modal
│
├── lib/                          # Business Logic
│   ├── api.ts                   ✅ Backend client
│   ├── conversationEngine.ts    ✅ Intelligence orchestration (390 lines)
│   ├── sianiMemory.ts          ✅ Memory & mood (340 lines)
│   ├── sdohCategories.ts       ✅ SDOH detection (380 lines)
│   ├── resourceEngine.ts       ✅ Resource catalog (390 lines)
│   ├── memoryVectorEngine.ts   ✅ Vector embeddings (310 lines)
│   └── followUpEngine.ts       ✅ Follow-ups (310 lines)
│
└── theme/                        # Design System
    └── luxury.ts                ✅ NEW Old money aesthetic (280 lines)
```

---

## ✅ What's Complete

- [x] **Luxury UI Components** (SianiAvatar, Waveform, MemoryCard)
- [x] **Voice-First Conversation Screen** (full-screen, audio recording, TTS)
- [x] **Luxury Feed Screen** (pull-to-refresh, fade-in, event cards)
- [x] **Old Money Theme System** (colors, typography, spacing, shadows)
- [x] **Intelligence Integration** (SDOH, memory, resources, follow-ups)
- [x] **Breathing Avatar Animation** (6s cycle, smooth)
- [x] **Haptic Feedback** (on all interactions)
- [x] **Audio Recording** (expo-av, high quality)
- [x] **Text-to-Speech** (expo-speech, warm tone)
- [x] **Waveform Visualization** (5-bar, animated)
- [x] **Comprehensive Documentation** (1,600+ lines)

---

## ⏳ Next Steps

### Critical (This Week)

1. **Integrate Transcription API**

   - Choose: OpenAI Whisper (recommended) or Google STT
   - Replace `simulateTranscription()` in conversation.tsx
   - Test with real voice input

2. **Configure OpenAI Embeddings**

   - Update `memoryVectorEngine.ts` with API key
   - Remove development fallback
   - Test similarity search accuracy

3. **Test on Physical Device**
   - iOS: Expo Go app
   - Android: Expo Go app
   - Verify audio permissions
   - Check haptic feedback

### Important (This Month)

1. Backend API endpoints (memory, vectors, loops)
2. Resource catalog expansion (20+ resources)
3. Push notifications for follow-ups
4. Onboarding flow (3 screens)
5. Analytics tracking

---

## 📊 Stats

```
Total Code:       ~2,500 lines TypeScript
Documentation:    ~1,600 lines Markdown
Components:       4 new + 2 existing
Screens:          1 new + 1 updated
Intelligence:     6 engines integrated
Theme System:     Complete (280 lines)
```

---

## 📚 Documentation

- **Complete Guide**: `../../MOBILE_SCAFFOLD_GUIDE.md` (900+ lines)
- **Checklist**: `../../MOBILE_SCAFFOLD_CHECKLIST.md` (600+ lines)
- **Summary**: `../../MOBILE_SCAFFOLD_SUMMARY.md` (100+ lines)
- **Intelligence**: `../../SIANI_INTELLIGENCE_COMPLETE.md` (6,700+ lines)
- **Quick Ref**: `../../SIANI_INTELLIGENCE_QUICKREF.md` (2,100+ lines)

---

## 🎉 Success Metrics

### Target KPIs

- **Daily Active Users**: 60%+ retention
- **Conversation Duration**: 3+ minutes average
- **SDOH Detection**: 40%+ of conversations
- **Resource Acceptance**: 50%+ of offers
- **Transcription Accuracy**: 95%+ word accuracy
- **App Rating**: 4.5+ stars

---

**"Not a helper — someone you aspire to be close to."**

🚀 **Siani Mobile: Voice-First Companion - READY TO TEST** - Luxury Voice-First Companion

A voice-first conversational AI experience built with React Native & Expo.

## Design Philosophy

**Subtle Luxury, Not Healthcare**

- Inspired by old money aesthetics: linen whites, warm beiges, matte blacks
- No medical metaphors, no support app visuals
- Feels like walking into a curated, private space

**Voice-First Interaction**

- Tap glowing avatar to speak
- Siani responds like a real person - intuitive, warm, emotionally aware
- Minimal visual chrome, maximum presence

## Tech Stack

- React Native + Expo
- TypeScript
- expo-speech (voice synthesis)
- expo-av (audio recording)
- expo-haptics (tactile feedback)
- Animated API for breathing effects

## Getting Started

```bash
cd packages/mobile
npm install
npm start
```

## Core Experience

1. **Home Screen**: Centered glowing avatar with breathing animation
2. **Voice Interaction**: Tap to speak, Siani responds naturally
3. **Conversation Log**: iMessage-style fade-ins, no tails, minimal chrome
4. **Background Context**: Silently enriches from goals + feed data

Siani is not a helper — she's someone you aspire to be close to.

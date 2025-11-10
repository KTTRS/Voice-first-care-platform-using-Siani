# Siani Mobile App

React Native mobile application built with Expo for the Voice-First Care Platform.

## ✨ Key Features

### 🎙️ Voice-First Conversational Interface
- **Natural voice conversations** with Siani, your AI companion
- **Real-time audio recording** with expo-av
- **Text-to-speech responses** for immersive experience
- **Waveform visualization** showing audio activity
- **Breathing avatar** that feels alive and responsive
- See [VOICE_QUICKSTART.md](./VOICE_QUICKSTART.md) for detailed voice features

### 🧠 Emotional Intelligence
- **SDOH Detection**: Passively detects social determinants of health from conversation
- **Mood Tracking**: Recognizes 13 emotional states
- **Memory System**: Remembers context and builds rapport over time
- **Resource Intelligence**: Offers help naturally, never pushy

### 🎨 Luxury "Old Money" Design
- Warm off-white backgrounds (#F9F7F4)
- Subtle gold accents (#DAA520)
- Breathing animations and haptic feedback
- Timeless, elegant, non-clinical aesthetic

### 📱 Core App Features
- **Goals Management**: View and track personal health goals
- **Activity Feed**: Real-time memory moments and events
- **Streak Tracking**: Monitor consecutive activity streaks
- **Token Authentication**: Secure API communication

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **Expo Router** for navigation
- **REST API** integration with backend

## Setup

### Quick Start

For a complete guide to voice capture features, see **[VOICE_QUICKSTART.md](./VOICE_QUICKSTART.md)**.

1. Install dependencies:

```bash
cd packages/mobile
npm install
```

2. Configure environment:

```bash
# .env file already configured
EXPO_PUBLIC_API_URL=http://localhost:3000
```

3. Start the development server:

```bash
npm start
# or
npx expo start
```

## Running the App

### Web

Press `w` in the Expo terminal or visit http://localhost:8081

### Android

- Install Expo Go app on your device
- Scan the QR code from the terminal
- Or press `a` if you have Android emulator set up

### iOS

- Install Expo Go app on your device
- Scan the QR code with the Camera app
- Or press `i` if you have iOS simulator set up

## Project Structure

```
app/
  ├── _layout.tsx        # Root layout
  ├── index.tsx          # Home screen with navigation
  ├── goals.tsx          # Goals screen
  └── feed.tsx           # Feed screen
lib/
  └── api.ts             # API client and helpers
```

## API Integration

The mobile app connects to the backend API at `http://localhost:3000` and uses the following endpoints:

- `GET /api/goals` - Fetch user goals
- `GET /api/feed` - Fetch activity feed
- `GET /api/streaks/my-stats` - Get current user's streak stats
- `GET /api/streaks/leaderboard` - Get streak leaderboard
- `POST /api/daily-actions/:id/complete` - Complete a daily action
- `POST /api/goals` - Create a new goal

All requests include `Authorization: Bearer test-token` header for authentication.

## Available Screens

### 🏠 Home Screen
- Platform overview
- Navigation to all features
- Breathing Siani avatar
- Quick access to conversation

### 🎙️ Conversation Screen (Voice-First)
- Full-screen voice interaction
- Tap avatar to record your voice
- Real-time waveform visualization
- Text-to-speech responses from Siani
- Message history with luxury styling
- SDOH detection and resource offering

### 🎯 Goals Screen

- List of all goals with pagination
- Pull-to-refresh functionality
- Active/Inactive status indicators
- Points and creation date display
- Loading and error states

### 📰 Feed Screen

- Memory moments from conversations
- Community activity feed with event types:
  - 🎯 GOAL_CREATED
  - 🏆 GOAL_COMPLETED
  - ✅ DAILY_ACTION_COMPLETED
  - 🔥 STREAK_MAINTAINED
  - 🔗 RESOURCE_USED
  - 💭 MEMORY_MOMENT
  - 🎉 MILESTONE
- Color-coded event types
- Relative timestamps (e.g., "2h ago")
- Pull-to-refresh functionality
- Loading and error states

## Development Notes

### Dependency Warning

You may see a warning about `react-native@0.72.6` vs expected `0.72.10`. This is non-critical and can be fixed with:

```bash
npx expo install --fix
```

### Backend Requirement

The backend must be running on port 3000 before using the mobile app:

```bash
cd packages/backend
npm run dev
```

### Testing

- Use the web version for quick iteration
- Test on physical devices for full native experience
- Pull-to-refresh works on mobile, not web

## Troubleshooting

**"Cannot connect to backend"**

- Ensure backend is running: `curl http://localhost:3000/health`
- Check `.env` has correct `EXPO_PUBLIC_API_URL`
- For physical devices, use your computer's IP address instead of localhost

**"Expo not starting"**

- Clear cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**"Module not found"**

- Make sure you're in the `packages/mobile` directory
- Run `npm install` to install dependencies

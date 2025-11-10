/\*\*

- Voice Analysis Integration Guide
-
- This guide explains how to integrate voice capture with emotion and SDOH detection
- in the Siani mobile app.
  \*/

## Components Created

### 1. VoiceCapture.tsx

Basic voice recording component with start/stop functionality.

- Records high-quality audio using expo-av
- Saves audio URI for processing
- Simple button UI with status indicator

### 2. EmotionalVoiceCapture.tsx

Advanced voice capture with emotion-aware UI and backend integration.

- Emotion-based color theming (calm=green, anxious=orange, distressed=red)
- Pulsing animation during recording
- Auto-uploads to backend for transcription
- Receives SDOH flags and emotion analysis

## Backend Integration

### API Endpoint: POST /api/voice/analyze

**Request:**

```
POST /api/voice/analyze
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- audio: file (m4a, mp3, wav, webm, ogg - max 10MB)
- userId: string
```

**Response:**

```json
{
  "transcription": "I'm feeling stressed about rent",
  "emotion": "anxious",
  "sdohFlags": ["housing_instability", "financial_hardship"],
  "memoryMomentId": "clxxxx",
  "timestamp": "2025-11-10T..."
}
```

**Processing Pipeline:**

1. Receives audio file upload
2. Transcribes with Whisper/Deepgram (TODO: integrate actual service)
3. Runs SDOH detection on transcription text
4. Analyzes emotion from keywords
5. Creates MemoryMoment with source="voice"
6. Triggers signal score update
7. Returns analysis results

### Database Schema

```prisma
model MemoryMoment {
  id        String   @id @default(cuid())
  userId    String
  content   String   // Transcription text
  emotion   String   // Detected emotion
  source    String?  @default("text") // "text" | "voice" | "chat"
  metadata  Json?    // { audioFile, sdohFlags, analyzedAt }
  ...
}
```

## Usage in Mobile App

### Basic Usage

```tsx
import VoiceCapture from "./components/VoiceCapture";

function MyScreen() {
  return (
    <VoiceCapture
      onRecordingComplete={(uri) => {
        console.log("Audio saved:", uri);
      }}
    />
  );
}
```

### Emotional Voice Capture

```tsx
import EmotionalVoiceCapture from "./components/EmotionalVoiceCapture";

function SianiConversationScreen() {
  const [emotionState, setEmotionState] = useState("calm");

  return (
    <EmotionalVoiceCapture
      emotionState={emotionState}
      onTranscriptionReceived={(text, emotion) => {
        console.log("User said:", text);
        console.log("Detected emotion:", emotion);
      }}
      onEmotionDetected={(emotion) => {
        setEmotionState(emotion);
        // Update Siani avatar glow color
      }}
    />
  );
}
```

## Integration with Siani Avatar

The voice capture should integrate with the emotion-aware Siani avatar:

```tsx
import { SianiAvatar } from "./components/SianiAvatar";
import EmotionalVoiceCapture from "./components/EmotionalVoiceCapture";

function SianiScreen() {
  const [emotion, setEmotion] = useState("calm");

  return (
    <View>
      <SianiAvatar emotion={emotion} isListening={isRecording} />

      <EmotionalVoiceCapture
        emotionState={emotion}
        onEmotionDetected={setEmotion}
        onTranscriptionReceived={(text) => {
          // Show transcription in chat
          // Trigger Siani response
        }}
      />
    </View>
  );
}
```

## Next Steps: Transcription Integration

### Option 1: OpenAI Whisper API

```typescript
import OpenAI from "openai";

async function transcribeWithWhisper(audioPath: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const file = fs.createReadStream(audioPath);

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "en",
  });

  return response.text;
}
```

### Option 2: Deepgram API

```typescript
import { Deepgram } from "@deepgram/sdk";

async function transcribeWithDeepgram(audioPath: string) {
  const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
  const file = fs.readFileSync(audioPath);

  const response = await deepgram.transcription.preRecorded(
    {
      buffer: file,
      mimetype: "audio/m4a",
    },
    {
      punctuate: true,
      language: "en",
    }
  );

  return response.results.channels[0].alternatives[0].transcript;
}
```

### Option 3: Local Whisper

```bash
# Install whisper.cpp or faster-whisper
pip install faster-whisper

# Use in Python service
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu")
segments, info = model.transcribe("audio.m4a")
transcription = " ".join([segment.text for segment in segments])
```

## SDOH Detection Flow

```
Voice Recording
    ↓
Upload to Backend
    ↓
Transcription Service (Whisper/Deepgram)
    ↓
Text Analysis:
- SDOH Keyword Detection (sdohDetector.ts)
- Emotion Classification (sentiment analysis)
- Intent/Topic Extraction
    ↓
Create MemoryMoment
    ↓
Trigger Signal Score Update
    ↓
Return Results to Mobile App
    ↓
Update UI & Siani Avatar
```

## Testing

### Test Voice Upload

```bash
# From mobile app, record audio and check logs
# Should see:
[VoiceCapture] Starting recording...
[VoiceCapture] Recording saved: file:///path/to/recording.m4a
[VoiceCapture] Analysis result: {transcription: "...", emotion: "...", sdohFlags: [...]}

# On backend:
[Voice] Analyzing audio for user clxxx
[Voice] File: audio-1699xxxxx.m4a
[Voice] SDOH flags detected: housing_instability, financial_hardship
```

### Test Endpoints

```bash
# Get voice recordings
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/voice/recordings/USER_ID

# Upload audio (with actual file)
curl -X POST -H "Authorization: Bearer TOKEN" \
  -F "audio=@recording.m4a" \
  -F "userId=USER_ID" \
  http://localhost:3000/api/voice/analyze
```

## Environment Variables

Add to `.env`:

```
# Transcription Service
OPENAI_API_KEY=sk-...
# OR
DEEPGRAM_API_KEY=...
```

## Security Considerations

1. **Audio File Storage**: Files stored in `/uploads/audio/` - should be secured
2. **File Size Limits**: Max 10MB per upload
3. **File Type Validation**: Only allow audio formats
4. **Cleanup**: Consider deleting audio files after processing
5. **Privacy**: Audio contains sensitive health information - encrypt at rest

## Performance

- Audio uploads may be slow on poor connections
- Show progress indicator during upload
- Consider compressing audio before upload
- Implement retry logic for failed uploads
- Cache transcriptions to avoid re-processing

## Future Enhancements

1. **Real-time Streaming**: Stream audio chunks for live transcription
2. **Speaker Diarization**: Identify multiple speakers
3. **Accent Detection**: Improve accuracy for diverse accents
4. **Background Noise Filtering**: Clean audio before transcription
5. **Voice Biometrics**: Verify user identity from voice
6. **Multilingual Support**: Auto-detect and transcribe in multiple languages
7. **Emotion in Voice**: Analyze tone/pitch for emotion (beyond text analysis)
8. **Wake Word Detection**: "Hey Siani" to trigger recording

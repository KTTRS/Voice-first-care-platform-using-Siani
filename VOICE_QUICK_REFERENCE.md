# Voice Capture Quick Reference

## Mobile App Usage

### Import Component

```tsx
import EmotionalVoiceCapture from "./components/EmotionalVoiceCapture";
```

### Basic Implementation

```tsx
<EmotionalVoiceCapture
  emotionState="calm"
  onTranscriptionReceived={(text, emotion) => {
    console.log("Transcription:", text);
    console.log("Emotion:", emotion);
  }}
  onEmotionDetected={(emotion) => {
    console.log("Detected:", emotion);
  }}
/>
```

## Backend API

### Upload Audio

```bash
POST /api/voice/analyze
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- audio: file
- userId: string
```

### Get Recordings

```bash
GET /api/voice/recordings/{userId}
Authorization: Bearer {token}
```

## Response Format

```json
{
  "transcription": "text",
  "emotion": "anxious|sad|angry|happy|calm|neutral",
  "sdohFlags": ["housing_instability", "financial_hardship"],
  "memoryMomentId": "clxxx",
  "timestamp": "2025-11-10T..."
}
```

## SDOH Keywords Detected

- **food_insecurity**: "hungry", "food stamps", "skip meals"
- **housing_instability**: "evicted", "homeless", "can't pay rent"
- **transportation**: "no ride", "can't get there", "no car"
- **childcare**: "no babysitter", "daycare too expensive"
- **financial_hardship**: "can't afford", "broke", "bills"
- **health_literacy**: "don't understand", "confused about meds"
- **trust_in_system**: "don't trust", "doctors don't listen"

## Emotion Keywords

- **anxious**: "worried", "stressed", "anxious", "scared"
- **sad**: "sad", "depressed", "hopeless", "lonely"
- **angry**: "angry", "frustrated", "hate"
- **happy**: "happy", "excited", "grateful", "wonderful"
- **calm**: "calm", "peaceful", "relaxed", "okay"

## Testing

```bash
# Run automated tests
./test-voice-analysis.sh

# Manual test with curl
curl -X POST http://localhost:3000/api/voice/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@recording.m4a" \
  -F "userId=$USER_ID"
```

## Next Steps

1. **Integrate Transcription**: Add Whisper or Deepgram API
2. **Test on Device**: Record real audio from mobile
3. **Tune Detection**: Adjust SDOH keywords for accuracy
4. **Add Real-time**: Implement streaming for live transcription

## Files Created

- `/packages/mobile/components/VoiceCapture.tsx`
- `/packages/mobile/components/EmotionalVoiceCapture.tsx`
- `/packages/backend/src/routes/voice.ts`
- `/test-voice-analysis.sh`
- `/VOICE_CAPTURE_GUIDE.md`
- `/VOICE_IMPLEMENTATION_COMPLETE.md`

## Dependencies

- Mobile: `expo-av@~14.0.7`
- Backend: `multer@1.4.5-lts.1`, `@types/multer@1.4.12`

✅ **Ready to Use**

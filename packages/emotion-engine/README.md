# Emotion Engine Microservice

ML-based emotion classification microservice using multimodal features (audio + text).

## Architecture

**Emotion Categories:**

- **calm**: Grounded, peaceful, balanced energy
- **guarded**: Cautious, tired, uncertain
- **lit**: Energetic, excited, vibrant

**Models:**

- Audio: Wav2Vec2 (`facebook/wav2vec2-base`) - 768d embeddings
- Text: Sentence Transformers (`all-mpnet-base-v2`) - 768d embeddings
- Fusion: Dense(1536→512) → ReLU → Dropout(0.2) → Dense(512→3, sigmoid)

**Blended Emotion Vectors:**
Instead of discrete labels, returns continuous 3D vectors:

- `[1, 0, 0]` = pure calm
- `[0, 1, 0]` = pure guarded
- `[0, 0, 1]` = pure lit
- `[0.2, 0.6, 0.2]` = "guarded with calm undertones"
- `[0.1, 0.3, 0.6]` = "lit with guarded caution"

**Modulation Output:**

```python
tts_pitch_shift = (lit * 0.08) - (calm * 0.02)
tts_speed_scale = 0.9 + lit * 0.2 - guarded * 0.05
glow_intensity = 0.4*calm + 0.25*guarded + 0.9*lit
glow_color = interpolate([amber, blue, green], emotion_vector)
```

## Endpoints

### `POST /api/emotion`

Discrete emotion classification

**Request:**

```json
{
  "audio": "<audio file>",
  "transcript": "I'm feeling pretty good today"
}
```

**Response:**

```json
{
  "emotion": "calm",
  "confidence": 0.87,
  "modulation": {
    "tts_pitch_shift": -0.015,
    "tts_speed_scale": 0.92,
    "glow_intensity": 0.87,
    "glow_easing_curve": "sine"
  }
}
```

### `POST /api/emotion/blended`

Continuous emotion vector classification

**Response:**

```json
{
  "emotion_vector": [0.2, 0.3, 0.5],
  "dominant_emotion": "lit",
  "confidence": 0.5,
  "emotion_blend": "guarded optimism",
  "modulation": {
    "tts_pitch_shift": 0.034,
    "tts_speed_scale": 1.025,
    "glow_intensity": 0.63,
    "glow_easing_curve": "cubic",
    "glow_color": "#82c365"
  }
}
```

## Development

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Run locally:**

```bash
uvicorn app.main:app --reload --port 8080
```

**Build Docker image:**

```bash
docker build -t emotion-engine .
```

**Run container:**

```bash
docker run -p 8080:8080 emotion-engine
```

## Deployment (Google Cloud Run)

**Build and push:**

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/emotion-engine
```

**Deploy:**

```bash
gcloud run deploy emotion-engine \
  --image gcr.io/PROJECT_ID/emotion-engine \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --allow-unauthenticated
```

**Environment variables:**

```bash
AUDIO_MODEL=facebook/wav2vec2-base
TEXT_MODEL=sentence-transformers/all-mpnet-base-v2
CLASSIFIER_PATH=/app/checkpoints/emotion_mapper.pt
```

## Integration with Backend

**TypeScript backend proxy:**

```typescript
// packages/backend/src/services/emotionEngine.service.ts
import axios from "axios";

const EMOTION_ENGINE_URL =
  process.env.EMOTION_ENGINE_URL || "http://localhost:8080";

export async function classifyEmotion(audioBuffer: Buffer, transcript: string) {
  const formData = new FormData();
  formData.append("audio", new Blob([audioBuffer]), "audio.wav");

  const response = await axios.post(
    `${EMOTION_ENGINE_URL}/api/emotion/blended`,
    formData,
    {
      params: { transcript },
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
}
```

**Fallback to rule-based:**

```typescript
try {
  return await classifyEmotion(audio, transcript);
} catch (error) {
  // Fallback to TypeScript emotion classifier
  return emotionClassifierService.classify(transcript, prosodyFeatures);
}
```

## Performance

**Latency:**

- Audio processing: ~50ms
- Text processing: ~30ms
- Inference: ~20ms
- **Total: <100ms** (excluding network)

**Memory:**

- Models: ~1.2GB
- Runtime: ~1.5GB peak

**Throughput:**

- Single request: 10-15 req/s
- Batched: 50+ req/s

## Future Enhancements

- [ ] Temporal smoothing (rolling window)
- [ ] Multi-GPU inference
- [ ] ONNX Runtime optimization
- [ ] Emotion trajectory tracking
- [ ] Custom fine-tuned models
- [ ] Real-time streaming support

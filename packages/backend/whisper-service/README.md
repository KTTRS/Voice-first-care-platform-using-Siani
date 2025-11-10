# Whisper Transcription Service - Local Deployment

This directory contains a self-hosted Whisper transcription service for HIPAA-compliant audio processing.

## Architecture

- **FastAPI** server with Whisper model
- **Docker** container with GPU support
- **Health check** endpoint for monitoring
- **Batch processing** support

## Quick Start

### 1. Build Docker Image

```bash
cd packages/backend/whisper-service
docker build -t siani-whisper .
```

### 2. Run with GPU (Recommended)

```bash
docker run -d \
  --name siani-whisper \
  --gpus all \
  -p 8000:8000 \
  -e WHISPER_MODEL=medium \
  siani-whisper
```

### 3. Run CPU-Only (Slower)

```bash
docker run -d \
  --name siani-whisper \
  -p 8000:8000 \
  -e WHISPER_MODEL=small \
  -e USE_CPU=true \
  siani-whisper
```

### 4. Test the Service

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "model": "medium"}

# Test transcription
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@test-audio.m4a"
# Expected: {"transcript": "...", "language": "en", "duration": 5.2}
```

## Environment Variables

| Variable        | Default  | Description                                  |
| --------------- | -------- | -------------------------------------------- |
| `WHISPER_MODEL` | `medium` | Model size: tiny, base, small, medium, large |
| `USE_CPU`       | `false`  | Force CPU mode (slower)                      |
| `MAX_WORKERS`   | `2`      | Concurrent transcription workers             |
| `MAX_FILE_SIZE` | `50`     | Max upload size in MB                        |
| `LOG_LEVEL`     | `info`   | Logging level: debug, info, warning, error   |

## Model Sizes & Performance

| Model  | Size    | GPU Memory | Speed (CPU) | Speed (GPU) | Accuracy  |
| ------ | ------- | ---------- | ----------- | ----------- | --------- |
| tiny   | 39 MB   | ~1 GB      | ~32x        | ~10x        | Fair      |
| base   | 74 MB   | ~1 GB      | ~16x        | ~7x         | Good      |
| small  | 244 MB  | ~2 GB      | ~6x         | ~4x         | Very Good |
| medium | 769 MB  | ~5 GB      | ~2x         | ~2x         | Excellent |
| large  | 1550 MB | ~10 GB     | ~1x         | ~1x         | Best      |

**Recommendation**: Use `medium` for production (best accuracy/speed balance).

## Deployment Options

### Option A: RunPod GPU Cloud ($0.20-0.40/hr)

1. Create RunPod account
2. Deploy PyTorch template with GPU
3. Clone repo and run Whisper service
4. Expose port 8000 via RunPod proxy

### Option B: AWS EC2 with GPU

1. Launch `g4dn.xlarge` instance (~$0.526/hr)
2. Install Docker + NVIDIA Container Toolkit
3. Run Whisper container with `--gpus all`
4. Configure security group for port 8000

### Option C: Modal.com Serverless

```python
import modal

stub = modal.Stub("siani-whisper")
image = modal.Image.debian_slim().pip_install("openai-whisper", "fastapi")

@stub.function(gpu="T4", image=image)
@modal.web_endpoint()
def transcribe(audio: bytes):
    import whisper
    model = whisper.load_model("medium")
    result = model.transcribe(audio)
    return {"transcript": result["text"]}
```

### Option D: Replicate.com API

Use Whisper via Replicate API (simpler than self-hosting):

```typescript
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const output = await replicate.run(
  "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
  { input: { audio: audioFileUrl } }
);
```

## Cost Comparison

| Service            | Cost per hour | Notes                       |
| ------------------ | ------------- | --------------------------- |
| OpenAI Whisper API | $0.006/min    | ~$0.36/hr @ 100% usage      |
| RunPod GPU         | $0.20-0.40/hr | Fixed cost, unlimited audio |
| AWS g4dn.xlarge    | $0.526/hr     | On-demand pricing           |
| Modal.com          | $0.000231/sec | Pay-per-use, GPU T4         |
| Replicate          | $0.00025/sec  | Pay-per-use                 |

**Breakeven**: Self-hosting is cheaper if you process >60 minutes/day.

## Security & HIPAA Compliance

✅ **Audio data stays on your infrastructure**  
✅ **No third-party API calls**  
✅ **Encryption at rest** (configure volume encryption)  
✅ **Audit logging** (CloudWatch or similar)  
✅ **BAA not required** (you control the data)

⚠️ **Still needed for HIPAA**:

- Encrypted storage volumes
- VPC network isolation
- Access logging and monitoring
- Regular security audits

## Monitoring & Alerts

### Prometheus Metrics

The service exposes `/metrics` endpoint:

```
whisper_transcriptions_total
whisper_transcription_duration_seconds
whisper_errors_total
whisper_model_loaded
```

### Health Check

```bash
# Simple health check
curl http://localhost:8000/health

# Detailed metrics
curl http://localhost:8000/metrics
```

### Uptime Monitoring

Configure alerts for:

- Service downtime (health check fails)
- High error rate (>5% errors)
- Slow transcription (>30s avg)
- High memory usage (>80% GPU memory)

## Troubleshooting

### Issue: Out of Memory

**Solution**: Use smaller model or reduce batch size

```bash
docker run -e WHISPER_MODEL=small -e MAX_WORKERS=1 siani-whisper
```

### Issue: Slow Transcription

**Solution**: Ensure GPU is available

```bash
# Check GPU inside container
docker exec siani-whisper nvidia-smi

# If no GPU, install NVIDIA Container Toolkit
```

### Issue: Language Detection Failing

**Solution**: Specify language explicitly

```bash
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@audio.m4a" \
  -F "language=en"
```

## API Reference

### POST /transcribe

Transcribe audio file to text.

**Request**:

```
Content-Type: multipart/form-data

audio: File (required)
language: string (optional) - ISO 639-1 code (en, es, fr, etc.)
temperature: float (optional) - 0.0-1.0, default 0.0
prompt: string (optional) - Context hint for better accuracy
```

**Response**:

```json
{
  "transcript": "I'm feeling stressed about rent this month.",
  "language": "en",
  "duration": 5.2,
  "segments": [
    {
      "start": 0.0,
      "end": 5.2,
      "text": "I'm feeling stressed about rent this month."
    }
  ]
}
```

### GET /health

Check service health.

**Response**:

```json
{
  "status": "healthy",
  "model": "medium",
  "gpu_available": true,
  "uptime_seconds": 3600
}
```

### GET /metrics

Prometheus metrics endpoint.

## Performance Tuning

### Optimize Model Loading

Models are cached in memory. Pre-load on startup:

```python
# server.py
model = whisper.load_model("medium")  # Load once at startup
```

### Enable Batching

Process multiple files in parallel:

```bash
docker run -e MAX_WORKERS=4 siani-whisper
```

### Use Faster Whisper

Alternative: Use `faster-whisper` (up to 4x faster):

```bash
pip install faster-whisper
```

```python
from faster_whisper import WhisperModel

model = WhisperModel("medium", device="cuda")
segments, info = model.transcribe("audio.mp3")
```

## License

This Whisper service uses OpenAI's Whisper model (MIT License).

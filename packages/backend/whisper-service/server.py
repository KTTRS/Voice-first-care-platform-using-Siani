"""
Whisper Transcription Service
FastAPI server for self-hosted audio transcription
"""

import os
import time
import tempfile
from typing import Optional
from pathlib import Path

import whisper
import torch
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from prometheus_client.core import CollectorRegistry

# Configuration
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium")
USE_CPU = os.getenv("USE_CPU", "false").lower() == "true"
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "50")) * 1024 * 1024  # 50MB default
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

# Initialize FastAPI
app = FastAPI(
    title="Siani Whisper Transcription Service",
    description="Self-hosted Whisper for HIPAA-compliant audio transcription",
    version="1.0.0",
)

# Prometheus metrics
registry = CollectorRegistry()
transcriptions_total = Counter(
    "whisper_transcriptions_total",
    "Total number of transcriptions",
    registry=registry,
)
transcription_duration = Histogram(
    "whisper_transcription_duration_seconds",
    "Transcription duration in seconds",
    registry=registry,
)
errors_total = Counter(
    "whisper_errors_total",
    "Total number of errors",
    ["error_type"],
    registry=registry,
)
model_loaded = Gauge(
    "whisper_model_loaded",
    "Whether Whisper model is loaded",
    registry=registry,
)

# Global model (loaded once at startup)
model = None
device = "cuda" if torch.cuda.is_available() and not USE_CPU else "cpu"
start_time = time.time()


@app.on_event("startup")
async def load_model():
    """Load Whisper model on startup"""
    global model
    print(f"Loading Whisper model: {WHISPER_MODEL} on device: {device}")
    
    try:
        model = whisper.load_model(WHISPER_MODEL, device=device)
        model_loaded.set(1)
        print(f"✅ Model loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        model_loaded.set(0)
        raise


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Siani Whisper Transcription",
        "model": WHISPER_MODEL,
        "device": device,
        "status": "healthy" if model else "unhealthy",
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    gpu_available = torch.cuda.is_available()
    gpu_name = torch.cuda.get_device_name(0) if gpu_available else None
    
    return {
        "status": "healthy" if model else "unhealthy",
        "model": WHISPER_MODEL,
        "device": device,
        "gpu_available": gpu_available,
        "gpu_name": gpu_name,
        "uptime_seconds": int(time.time() - start_time),
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest(registry)


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    temperature: Optional[float] = Form(0.0),
    prompt: Optional[str] = Form(None),
):
    """
    Transcribe audio file to text
    
    Args:
        audio: Audio file (m4a, mp3, wav, webm, ogg)
        language: ISO 639-1 language code (optional, auto-detect if not provided)
        temperature: Sampling temperature 0.0-1.0 (optional, default 0.0)
        prompt: Context hint for better accuracy (optional)
    
    Returns:
        {
            "transcript": "transcribed text",
            "language": "en",
            "duration": 5.2,
            "segments": [...]
        }
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Check file size
    file_size = 0
    chunk = await audio.read(MAX_FILE_SIZE + 1)
    file_size = len(chunk)
    
    if file_size > MAX_FILE_SIZE:
        errors_total.labels(error_type="file_too_large").inc()
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB",
        )
    
    # Save to temp file
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as temp_file:
            temp_file.write(chunk)
            temp_path = temp_file.name
        
        print(f"Transcribing audio: {audio.filename} ({file_size / 1024:.1f}KB)")
        
        # Transcribe
        start = time.time()
        
        result = model.transcribe(
            temp_path,
            language=language,
            temperature=temperature,
            initial_prompt=prompt,
            verbose=False,
        )
        
        duration = time.time() - start
        
        # Update metrics
        transcriptions_total.inc()
        transcription_duration.observe(duration)
        
        print(
            f"✅ Transcription complete in {duration:.2f}s "
            f"(language: {result.get('language', 'unknown')})"
        )
        
        return JSONResponse(
            content={
                "transcript": result["text"],
                "language": result.get("language"),
                "duration": result.get("duration"),
                "segments": result.get("segments", []),
            }
        )
    
    except Exception as e:
        errors_total.labels(error_type="transcription_error").inc()
        print(f"❌ Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@app.post("/transcribe/batch")
async def transcribe_batch(files: list[UploadFile] = File(...)):
    """
    Batch transcribe multiple audio files
    
    Returns:
        {
            "results": [
                {"filename": "audio1.m4a", "transcript": "...", "status": "success"},
                {"filename": "audio2.m4a", "error": "...", "status": "error"}
            ]
        }
    """
    results = []
    
    for audio in files:
        try:
            result = await transcribe(audio)
            results.append({
                "filename": audio.filename,
                "transcript": result["transcript"],
                "language": result.get("language"),
                "status": "success",
            })
        except Exception as e:
            results.append({
                "filename": audio.filename,
                "error": str(e),
                "status": "error",
            })
    
    return {"results": results}


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level=LOG_LEVEL,
    )

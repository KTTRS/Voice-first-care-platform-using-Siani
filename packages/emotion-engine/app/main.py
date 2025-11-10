"""
FastAPI Emotion Engine Service

Multimodal emotion classification with audio (Wav2Vec2) and text (sentence transformers)
Returns blended emotion vectors for smooth TTS and avatar modulation
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.inference import predict_emotion, predict_emotion_blended
from app.schemas import EmotionResponse, BlendedEmotionResponse, HealthResponse
import uvicorn

app = FastAPI(
    title="SAINTE Emotion Engine",
    version="1.0",
    description="Multimodal emotion classification for voice-first healthcare"
)

# CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "emotion-engine", "version": "1.0"}

@app.post("/api/emotion")
async def emotion_endpoint(
    audio: UploadFile,
    transcript: str = Form(...),
):
    """
    Classify emotion from audio + transcript
    
    Returns discrete emotion category (calm, guarded, lit)
    """
    try:
        result = await predict_emotion(audio, transcript)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion classification failed: {str(e)}")

@app.post("/api/emotion/blended")
async def emotion_blended_endpoint(
    audio: UploadFile,
    transcript: str = Form(...),
):
    """
    Classify emotion with blended vector output
    
    Returns continuous emotion vector for smooth transitions
    Supports mixed states: guarded optimism, hopeful fatigue, etc.
    """
    try:
        result = await predict_emotion_blended(audio, transcript)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blended emotion classification failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)

"""
Pydantic schemas for emotion engine API

Request/response models for validation
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class EmotionRequest(BaseModel):
    """Request schema for discrete emotion classification"""
    transcript: str = Field(..., description="Transcribed text from speech")

class EmotionResponse(BaseModel):
    """Response schema for discrete emotion classification"""
    emotion: str = Field(..., description="Predicted emotion category: calm, guarded, or lit")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    modulation: Dict[str, float] = Field(..., description="TTS and avatar modulation parameters")

class BlendedEmotionResponse(BaseModel):
    """Response schema for blended emotion classification"""
    emotion_vector: List[float] = Field(..., description="3D emotion vector [calm, guarded, lit]")
    dominant_emotion: str = Field(..., description="Dominant emotion category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in dominant emotion")
    emotion_blend: str = Field(..., description="Human-readable emotion blend description")
    modulation: Dict[str, float] = Field(..., description="Blended modulation parameters")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(default="healthy")
    models_loaded: bool = Field(default=False)

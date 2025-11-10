"""
Emotion Classification Inference Pipeline

Multimodal emotion classification using:
1. Audio features (Wav2Vec2)
2. Text features (sentence transformers)
3. Fusion classifier (TorchScript or ONNX)

Supports both discrete and blended emotion outputs
"""

import torch
import torchaudio
from transformers import Wav2Vec2Processor, Wav2Vec2Model, AutoTokenizer, AutoModel
import numpy as np
import tempfile
import os
from typing import Dict, Any
from app.emotion_blend import process_emotion_logits

# Model configuration
AUDIO_MODEL = "facebook/wav2vec2-base"
TEXT_MODEL = "sentence-transformers/all-mpnet-base-v2"
CLASSIFIER_PATH = "./checkpoints/emotion_mapper.pt"

# Emotion categories
EMOTIONS = ["calm", "guarded", "lit"]

# Lazy load models
audio_processor = None
audio_encoder = None
text_tokenizer = None
text_encoder = None
classifier = None

def load_models():
    """Lazy load ML models"""
    global audio_processor, audio_encoder, text_tokenizer, text_encoder, classifier
    
    if audio_processor is None:
        print("Loading Wav2Vec2 audio encoder...")
        audio_processor = Wav2Vec2Processor.from_pretrained(AUDIO_MODEL)
        audio_encoder = Wav2Vec2Model.from_pretrained(AUDIO_MODEL)
        audio_encoder.eval()
    
    if text_tokenizer is None:
        print("Loading sentence transformer text encoder...")
        text_tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL)
        text_encoder = AutoModel.from_pretrained(TEXT_MODEL)
        text_encoder.eval()
    
    if classifier is None:
        print("Loading emotion classifier...")
        # For now, use a placeholder - replace with actual trained model
        # classifier = torch.jit.load(CLASSIFIER_PATH)
        # Fallback to simple rule-based classifier
        pass

async def predict_emotion(audio, transcript: str) -> Dict[str, Any]:
    """
    Predict discrete emotion category
    
    Returns:
        {
            "emotion": "calm" | "guarded" | "lit",
            "confidence": 0-1,
            "modulation": {
                "tts_pitch_shift": float,
                "tts_speed_scale": float,
                "glow_intensity": float,
                "glow_easing_curve": str
            }
        }
    """
    load_models()
    
    # Save uploaded audio to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Extract audio features
        waveform, sr = torchaudio.load(tmp_path)
        
        # Resample if needed
        if sr != 16000:
            resampler = torchaudio.transforms.Resample(sr, 16000)
            waveform = resampler(waveform)
            sr = 16000
        
        # Process audio
        inputs = audio_processor(waveform.squeeze().numpy(), sampling_rate=sr, return_tensors="pt")
        
        with torch.no_grad():
            audio_outputs = audio_encoder(**inputs)
            audio_feat = audio_outputs.last_hidden_state.mean(dim=1)
        
        # Extract text features
        tokens = text_tokenizer(transcript, return_tensors="pt", truncation=True, max_length=512)
        
        with torch.no_grad():
            text_outputs = text_encoder(**tokens)
            text_feat = text_outputs.last_hidden_state.mean(dim=1)
        
        # Fuse features
        fused = torch.cat((audio_feat, text_feat), dim=1)
        
        # Classifier inference (placeholder - use rule-based for now)
        # In production, load actual trained classifier
        probs = _rule_based_classification(transcript, waveform, sr)
        
        emotion_idx = int(np.argmax(probs))
        emotion = EMOTIONS[emotion_idx]
        confidence = float(np.max(probs))
        
        # Generate modulation parameters
        modulation = _generate_modulation(probs, emotion)
        
        return {
            "emotion": emotion,
            "confidence": confidence,
            "modulation": modulation
        }
    
    finally:
        # Cleanup temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

async def predict_emotion_blended(audio, transcript: str) -> Dict[str, Any]:
    """
    Predict blended emotion vector for smooth transitions
    
    Returns:
        {
            "emotion_vector": [calm, guarded, lit],
            "dominant_emotion": str,
            "confidence": float,
            "modulation": {...},
            "emotion_blend": str  # e.g., "guarded optimism"
        }
    """
    load_models()
    
    # Save uploaded audio to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Extract audio features
        waveform, sr = torchaudio.load(tmp_path)
        
        # Resample if needed
        if sr != 16000:
            resampler = torchaudio.transforms.Resample(sr, 16000)
            waveform = resampler(waveform)
            sr = 16000
        
        # Process audio
        inputs = audio_processor(waveform.squeeze().numpy(), sampling_rate=sr, return_tensors="pt")
        
        with torch.no_grad():
            audio_outputs = audio_encoder(**inputs)
            audio_feat = audio_outputs.last_hidden_state.mean(dim=1)
        
        # Extract text features
        tokens = text_tokenizer(transcript, return_tensors="pt", truncation=True, max_length=512)
        
        with torch.no_grad():
            text_outputs = text_encoder(**tokens)
            text_feat = text_outputs.last_hidden_state.mean(dim=1)
        
        # Fuse features
        fused = torch.cat((audio_feat, text_feat), dim=1)
        
        # Get continuous emotion vector (placeholder - use rule-based for now)
        emotion_vector = _rule_based_classification(transcript, waveform, sr)
        
        # Apply temporal smoothing (optional)
        # emotion_vector = 0.7 * emotion_vector + 0.3 * previous_vector
        
        # Generate blended modulation
        modulation = _generate_blended_modulation(emotion_vector)
        
        # Determine dominant emotion and blend description
        dominant_idx = int(np.argmax(emotion_vector))
        dominant_emotion = EMOTIONS[dominant_idx]
        confidence = float(emotion_vector[dominant_idx])
        
        # Detect mixed states
        emotion_blend = _detect_emotion_blend(emotion_vector)
        
        return {
            "emotion_vector": emotion_vector.tolist(),
            "dominant_emotion": dominant_emotion,
            "confidence": confidence,
            "emotion_blend": emotion_blend,
            "modulation": modulation
        }
    
    finally:
        # Cleanup temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def _rule_based_classification(transcript: str, waveform: torch.Tensor, sr: int) -> np.ndarray:
    """
    Rule-based emotion classification (placeholder for trained model)
    
    Returns probabilities for [calm, guarded, lit]
    """
    transcript_lower = transcript.lower()
    
    # Initialize scores
    calm_score = 0.33
    guarded_score = 0.33
    lit_score = 0.33
    
    # Lexical indicators (from existing emotion classifier)
    calm_indicators = ["yeah", "actually", "clear", "peaceful", "fine", "okay", "calm", "steady"]
    guarded_indicators = ["i mean", "i guess", "maybe", "kind of", "tired", "worried", "uncertain"]
    lit_indicators = ["let's do it", "amazing", "excited", "can't wait", "love", "yes", "ready"]
    
    for word in calm_indicators:
        if word in transcript_lower:
            calm_score += 0.1
    
    for word in guarded_indicators:
        if word in transcript_lower:
            guarded_score += 0.1
    
    for word in lit_indicators:
        if word in transcript_lower:
            lit_score += 0.15
    
    # Audio features (simple heuristics)
    # Calculate RMS energy
    energy = torch.sqrt(torch.mean(waveform ** 2)).item()
    
    if energy > 0.5:
        lit_score += 0.2
    elif energy < 0.2:
        guarded_score += 0.15
    else:
        calm_score += 0.1
    
    # Normalize to probabilities
    total = calm_score + guarded_score + lit_score
    probs = np.array([calm_score, guarded_score, lit_score]) / total
    
    return probs

def _generate_modulation(probs: np.ndarray, emotion: str) -> Dict[str, Any]:
    """Generate TTS and avatar modulation parameters"""
    return {
        "tts_pitch_shift": round((probs[2] - probs[0]) * 0.08, 3),
        "tts_speed_scale": round(0.9 + probs[2] * 0.2, 3),
        "glow_intensity": round(float(np.max(probs)), 2),
        "glow_easing_curve": "sine" if emotion == "calm" else ("ease-in" if emotion == "guarded" else "cubic")
    }

def _generate_blended_modulation(emotion_vector: np.ndarray) -> Dict[str, Any]:
    """
    Generate blended modulation parameters from continuous emotion vector
    
    Interpolates TTS and avatar parameters based on emotion mix
    """
    calm, guarded, lit = emotion_vector
    
    # Blended TTS pitch shift
    tts_pitch_shift = round((lit * 0.08) - (calm * 0.02) + (guarded * 0.03), 3)
    
    # Blended TTS speed scale
    tts_speed_scale = round(0.9 + lit * 0.25 - guarded * 0.05, 3)
    
    # Blended glow intensity
    glow_intensity = round(0.4 * calm + 0.25 * guarded + 0.9 * lit, 2)
    
    # Determine easing curve based on dominant emotion
    if calm > 0.5:
        glow_easing_curve = "sine"
    elif guarded > 0.5:
        glow_easing_curve = "ease-in"
    else:
        glow_easing_curve = "cubic"
    
    # Generate color gradient (optional)
    glow_color = _interpolate_color(emotion_vector)
    
    return {
        "tts_pitch_shift": tts_pitch_shift,
        "tts_speed_scale": tts_speed_scale,
        "glow_intensity": glow_intensity,
        "glow_easing_curve": glow_easing_curve,
        "glow_color": glow_color
    }

def _interpolate_color(emotion_vector: np.ndarray) -> str:
    """
    Interpolate glow color based on emotion blend
    
    Calm → warm amber (#F59E42)
    Guarded → cool blue (#4A90E2)
    Lit → vivid green (#7ED321)
    """
    calm, guarded, lit = emotion_vector
    
    # RGB values
    amber = np.array([245, 158, 66])   # Calm
    blue = np.array([74, 144, 226])    # Guarded
    green = np.array([126, 211, 33])   # Lit
    
    # Weighted blend
    blended_rgb = calm * amber + guarded * blue + lit * green
    blended_rgb = np.clip(blended_rgb, 0, 255).astype(int)
    
    # Convert to hex
    return f"#{blended_rgb[0]:02x}{blended_rgb[1]:02x}{blended_rgb[2]:02x}"

def _detect_emotion_blend(emotion_vector: np.ndarray) -> str:
    """
    Detect mixed emotional states
    
    Returns human-readable blend description
    """
    calm, guarded, lit = emotion_vector
    
    # Thresholds for mixed states
    threshold = 0.3
    
    # Check for mixed states
    if calm > threshold and lit > threshold:
        return "hopeful calm"  # peaceful optimism
    elif guarded > threshold and lit > threshold:
        return "guarded optimism"  # cautious excitement
    elif calm > threshold and guarded > threshold:
        return "resolute peace"  # grounded caution
    elif calm > 0.6:
        return "pure calm"
    elif guarded > 0.6:
        return "pure guarded"
    elif lit > 0.6:
        return "pure lit"
    else:
        return "neutral blend"

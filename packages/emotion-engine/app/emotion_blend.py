"""
Emotion Blending Module

Converts raw model logits into continuous emotion blend vectors with smooth transitions.
Supports natural blending between emotions during conversation and generates modulation
parameters for TTS and avatar animation.
"""

import torch
import numpy as np

EMOTION_LABELS = ["calm", "guarded", "lit"]

def softmax(x):
    """
    Compute softmax values for array x.
    
    Args:
        x: Input array or list
        
    Returns:
        Normalized probability distribution
    """
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=0)

def blend_emotions(logits, alpha=0.7):
    """
    Converts raw logits into continuous emotion blend vector.
    
    Args:
        logits: Raw model output logits (array-like)
        alpha: Temperature smoothing factor (higher = sharper confidence)
        
    Returns:
        Dictionary mapping emotion labels to probabilities
    """
    probs = softmax(np.array(logits) / alpha)
    probs = np.clip(probs, 0, 1)
    return dict(zip(EMOTION_LABELS, probs))

def compute_modulation(blend):
    """
    Interpolates modulation parameters for voice + avatar animation.
    
    Args:
        blend: Dictionary with emotion probabilities {calm, guarded, lit}
        
    Returns:
        Dictionary with TTS and visual modulation parameters
    """
    calm, guarded, lit = blend["calm"], blend["guarded"], blend["lit"]

    # TTS parameters
    tts_pitch_shift = round((lit - calm) * 0.08, 3)
    tts_speed_scale = round(0.9 + lit * 0.2 - guarded * 0.05, 3)

    # Visual parameters
    glow_intensity = round(0.4 * calm + 0.25 * guarded + 0.9 * lit, 2)
    hue_shift = round(120 * lit + 240 * guarded, 1)  # color hue by emotion
    easing_curve = (
        "sine" if calm > 0.6 else
        "ease-in" if guarded > 0.5 else
        "cubic"
    )

    return {
        "tts_pitch_shift": tts_pitch_shift,
        "tts_speed_scale": tts_speed_scale,
        "glow_intensity": glow_intensity,
        "glow_hue": hue_shift,
        "glow_easing_curve": easing_curve,
    }

def smooth_blend(prev_blend, new_blend, smoothing=0.3):
    """
    Temporal smoothing between emotion vectors to avoid jitter.
    
    Args:
        prev_blend: Previous emotion blend dictionary
        new_blend: New emotion blend dictionary
        smoothing: Smoothing factor (0 = all new, 1 = all previous)
        
    Returns:
        Smoothed emotion blend dictionary
    """
    smoothed = {}
    for key in EMOTION_LABELS:
        smoothed[key] = round(
            (1 - smoothing) * new_blend[key] + smoothing * prev_blend[key],
            3
        )
    return smoothed

def process_emotion_logits(logits, prev_blend=None):
    """
    End-to-end blending pipeline: logits → continuous blend → smoothed output.
    
    Args:
        logits: Raw model logits (array-like)
        prev_blend: Optional previous blend for temporal smoothing
        
    Returns:
        Dictionary with blend_vector and modulation parameters
    """
    new_blend = blend_emotions(logits)
    final_blend = (
        smooth_blend(prev_blend, new_blend) if prev_blend else new_blend
    )
    modulation = compute_modulation(final_blend)
    return {"blend_vector": final_blend, "modulation": modulation}

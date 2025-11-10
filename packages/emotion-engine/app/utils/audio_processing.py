"""
Audio preprocessing utilities

Waveform loading, resampling, feature extraction
"""

import torch
import torchaudio
import numpy as np
from typing import Tuple

TARGET_SAMPLE_RATE = 16000

def load_audio(file_path: str) -> Tuple[torch.Tensor, int]:
    """
    Load audio file and return waveform + sample rate
    
    Args:
        file_path: Path to audio file
        
    Returns:
        (waveform, sample_rate)
    """
    waveform, sr = torchaudio.load(file_path)
    return waveform, sr

def resample_audio(waveform: torch.Tensor, original_sr: int, target_sr: int = TARGET_SAMPLE_RATE) -> torch.Tensor:
    """
    Resample audio to target sample rate
    
    Args:
        waveform: Audio tensor
        original_sr: Original sample rate
        target_sr: Target sample rate (default 16kHz for Wav2Vec2)
        
    Returns:
        Resampled waveform
    """
    if original_sr == target_sr:
        return waveform
    
    resampler = torchaudio.transforms.Resample(original_sr, target_sr)
    return resampler(waveform)

def normalize_audio(waveform: torch.Tensor) -> torch.Tensor:
    """
    Normalize audio to [-1, 1] range
    
    Args:
        waveform: Audio tensor
        
    Returns:
        Normalized waveform
    """
    max_val = torch.abs(waveform).max()
    if max_val > 0:
        return waveform / max_val
    return waveform

def compute_rms_energy(waveform: torch.Tensor) -> float:
    """
    Compute RMS energy of audio
    
    Args:
        waveform: Audio tensor
        
    Returns:
        RMS energy (scalar)
    """
    return torch.sqrt(torch.mean(waveform ** 2)).item()

def compute_zcr(waveform: torch.Tensor) -> float:
    """
    Compute zero-crossing rate
    
    Args:
        waveform: Audio tensor
        
    Returns:
        Zero-crossing rate (scalar)
    """
    waveform_np = waveform.squeeze().numpy()
    zcr = np.sum(np.abs(np.diff(np.sign(waveform_np)))) / (2 * len(waveform_np))
    return float(zcr)

def extract_acoustic_features(waveform: torch.Tensor, sr: int) -> dict:
    """
    Extract simple acoustic features for rule-based heuristics
    
    Args:
        waveform: Audio tensor
        sr: Sample rate
        
    Returns:
        Dictionary of acoustic features
    """
    energy = compute_rms_energy(waveform)
    zcr = compute_zcr(waveform)
    
    return {
        "energy": energy,
        "zcr": zcr,
        "duration": waveform.shape[-1] / sr
    }

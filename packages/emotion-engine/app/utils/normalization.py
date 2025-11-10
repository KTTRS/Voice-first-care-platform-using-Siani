"""
Normalization utilities

Feature scaling and standardization
"""

import numpy as np
import torch
from typing import Optional

class FeatureScaler:
    """
    Online feature scaler with running statistics
    """
    
    def __init__(self, feature_dim: int):
        self.feature_dim = feature_dim
        self.mean = np.zeros(feature_dim)
        self.std = np.ones(feature_dim)
        self.count = 0
    
    def update(self, features: np.ndarray):
        """Update running statistics"""
        batch_mean = features.mean(axis=0)
        batch_std = features.std(axis=0)
        
        # Online update
        n = self.count
        m = len(features)
        
        self.mean = (n * self.mean + m * batch_mean) / (n + m)
        self.std = np.sqrt((n * self.std**2 + m * batch_std**2) / (n + m))
        self.count += m
    
    def transform(self, features: np.ndarray) -> np.ndarray:
        """Apply z-score normalization"""
        return (features - self.mean) / (self.std + 1e-8)

def smooth_temporal(current: np.ndarray, previous: Optional[np.ndarray], alpha: float = 0.7) -> np.ndarray:
    """
    Temporal smoothing for emotion vectors
    
    Args:
        current: Current emotion vector
        previous: Previous emotion vector
        alpha: Smoothing factor (0.7 = 70% current, 30% previous)
        
    Returns:
        Smoothed emotion vector
    """
    if previous is None:
        return current
    
    return alpha * current + (1 - alpha) * previous

def interpolate_emotion_vector(start: np.ndarray, end: np.ndarray, t: float) -> np.ndarray:
    """
    Linear interpolation between emotion vectors
    
    Args:
        start: Starting emotion vector
        end: Ending emotion vector
        t: Interpolation parameter (0-1)
        
    Returns:
        Interpolated emotion vector
    """
    interpolated = (1 - t) * start + t * end
    
    # Normalize to ensure sum = 1
    return interpolated / interpolated.sum()

"""
Feature fusion utilities

Concatenate and normalize multimodal embeddings
"""

import torch
import torch.nn.functional as F
from typing import Tuple

def concatenate_features(audio_feat: torch.Tensor, text_feat: torch.Tensor) -> torch.Tensor:
    """
    Concatenate audio and text features
    
    Args:
        audio_feat: Audio embeddings (batch_size, 768)
        text_feat: Text embeddings (batch_size, 768)
        
    Returns:
        Concatenated features (batch_size, 1536)
    """
    return torch.cat((audio_feat, text_feat), dim=1)

def normalize_features(features: torch.Tensor, method: str = "l2") -> torch.Tensor:
    """
    Normalize feature vectors
    
    Args:
        features: Feature tensor
        method: Normalization method ("l2", "minmax", "zscore")
        
    Returns:
        Normalized features
    """
    if method == "l2":
        return F.normalize(features, p=2, dim=1)
    elif method == "minmax":
        min_val = features.min(dim=1, keepdim=True)[0]
        max_val = features.max(dim=1, keepdim=True)[0]
        return (features - min_val) / (max_val - min_val + 1e-8)
    elif method == "zscore":
        mean = features.mean(dim=1, keepdim=True)
        std = features.std(dim=1, keepdim=True)
        return (features - mean) / (std + 1e-8)
    else:
        return features

def apply_attention_fusion(audio_feat: torch.Tensor, text_feat: torch.Tensor) -> torch.Tensor:
    """
    Apply attention-based fusion (future enhancement)
    
    Args:
        audio_feat: Audio embeddings
        text_feat: Text embeddings
        
    Returns:
        Attention-weighted fused features
    """
    # Placeholder for future attention mechanism
    # Could implement cross-modal attention here
    return concatenate_features(audio_feat, text_feat)

"""
Model architecture definitions

Emotion classifier neural network
"""

import torch
import torch.nn as nn

class EmotionClassifier(nn.Module):
    """
    Fusion classifier for emotion classification
    
    Architecture:
    - Input: 1536d (768 audio + 768 text)
    - Dense(1536 → 512) + ReLU
    - Dropout(0.2)
    - Dense(512 → 3) + Sigmoid
    - Output: [calm, guarded, lit] probabilities
    """
    
    def __init__(self, input_dim: int = 1536, hidden_dim: int = 512, output_dim: int = 3):
        super().__init__()
        
        self.classifier = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, output_dim),
            nn.Sigmoid()
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass
        
        Args:
            x: Fused features (batch_size, 1536)
            
        Returns:
            Emotion probabilities (batch_size, 3)
        """
        return self.classifier(x)

class AttentionFusionClassifier(nn.Module):
    """
    Advanced classifier with cross-modal attention
    
    (Future enhancement)
    """
    
    def __init__(self, audio_dim: int = 768, text_dim: int = 768, output_dim: int = 3):
        super().__init__()
        
        # Cross-modal attention
        self.audio_attention = nn.MultiheadAttention(audio_dim, num_heads=8)
        self.text_attention = nn.MultiheadAttention(text_dim, num_heads=8)
        
        # Fusion layers
        self.fusion = nn.Sequential(
            nn.Linear(audio_dim + text_dim, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, output_dim),
            nn.Sigmoid()
        )
    
    def forward(self, audio_feat: torch.Tensor, text_feat: torch.Tensor) -> torch.Tensor:
        """
        Forward pass with attention
        
        Args:
            audio_feat: Audio embeddings (batch_size, 768)
            text_feat: Text embeddings (batch_size, 768)
            
        Returns:
            Emotion probabilities (batch_size, 3)
        """
        # Self-attention
        audio_attn, _ = self.audio_attention(audio_feat, audio_feat, audio_feat)
        text_attn, _ = self.text_attention(text_feat, text_feat, text_feat)
        
        # Concatenate attended features
        fused = torch.cat((audio_attn, text_attn), dim=-1)
        
        # Classify
        return self.fusion(fused)

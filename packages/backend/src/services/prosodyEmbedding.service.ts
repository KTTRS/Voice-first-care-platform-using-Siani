/**
 * Prosody Embedding Service
 *
 * Converts prosody data (pitch, energy, emotion, tempo) into numeric vectors
 * that can be embedded alongside text embeddings for emotional memory retrieval.
 *
 * Vector Structure (4 dimensions):
 * [0] normalized_pitch: 0-1 (pitchHz / 500)
 * [1] energy: 0-1 (RMS energy)
 * [2] emotion_intensity: 0-1 (from emotion config)
 * [3] tempo_variance: 0-1 (computed from pitch variance)
 */

import { EmotionLevel } from "../utils/emotionAnalysis";

interface ProsodyData {
  pitchHz: number; // 0-500 (typical speech range)
  energy: number; // 0-1 (RMS energy)
  emotion: EmotionLevel;
  pitchVariance?: number; // Optional: standard deviation of pitch
}

interface ProsodyVector {
  vector: number[]; // [normalized_pitch, energy, emotion_intensity, tempo_variance]
  emotionIntensity: number; // For weighting in memory scoring
}

// Emotion intensity mapping (based on arousal levels)
const EMOTION_INTENSITY_MAP: Record<EmotionLevel, number> = {
  low: 0.3, // Calm, subdued
  neutral: 0.5, // Balanced baseline
  high: 0.9, // Excited, energetic
  detached: 0.1, // Withdrawn, minimal engagement
  anxious: 0.7, // Worried, tense
  calm: 0.4, // Peaceful, stable
  guarded: 0.6, // Cautious, reserved
  lit: 0.8, // Elevated, energized
};

class ProsodyEmbeddingService {
  /**
   * Generate prosody embedding vector from voice characteristics
   */
  generateProsodyEmbedding(prosody: ProsodyData): ProsodyVector {
    // Normalize pitch to 0-1 range (typical speech: 80-500 Hz)
    const normalizedPitch = Math.min(1, Math.max(0, prosody.pitchHz / 500));

    // Energy is already 0-1 (RMS)
    const energy = Math.min(1, Math.max(0, prosody.energy));

    // Map emotion to intensity score
    const emotionIntensity =
      EMOTION_INTENSITY_MAP[prosody.emotion] || EMOTION_INTENSITY_MAP.neutral;

    // Compute tempo variance (if pitch variance provided, else derive from pitch)
    // Higher variance = more dynamic speech = higher tempo variance
    let tempoVariance = 0.5; // Default neutral
    if (prosody.pitchVariance !== undefined) {
      // Normalize variance to 0-1 (typical variance: 0-100 Hz)
      tempoVariance = Math.min(1, Math.max(0, prosody.pitchVariance / 100));
    } else {
      // Heuristic: high energy + high pitch = higher variance
      tempoVariance = energy * 0.6 + normalizedPitch * 0.4;
    }

    return {
      vector: [normalizedPitch, energy, emotionIntensity, tempoVariance],
      emotionIntensity,
    };
  }

  /**
   * Combine text and prosody embeddings into a unified vector
   *
   * Strategy: Concatenate text embedding (1536d from OpenAI) + prosody vector (4d)
   * Result: 1540-dimensional combined embedding
   */
  combinedEmbedding(
    textEmbedding: number[],
    prosodyEmbedding: ProsodyVector
  ): number[] {
    return [...textEmbedding, ...prosodyEmbedding.vector];
  }

  /**
   * Compute prosody similarity between two prosody vectors
   * Uses cosine similarity on 4D prosody space
   */
  computeProsodySimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== 4 || vector2.length !== 4) {
      throw new Error("Prosody vectors must be 4-dimensional");
    }

    // Cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < 4; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }

    const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Extract emotion intensity from prosody vector
   */
  extractEmotionIntensity(prosodyVector: number[]): number {
    if (prosodyVector.length >= 3) {
      return prosodyVector[2]; // emotion_intensity is at index 2
    }
    return 0.5; // Default neutral
  }

  /**
   * Aggregate prosody data over multiple frames (for memory creation)
   * Useful when storing a memory from a multi-second conversation chunk
   */
  aggregateProsodyFrames(frames: ProsodyData[]): ProsodyData {
    if (frames.length === 0) {
      return {
        pitchHz: 180, // Default neutral pitch
        energy: 0.4,
        emotion: "neutral",
      };
    }

    // Compute averages
    const avgPitch =
      frames.reduce((sum, f) => sum + f.pitchHz, 0) / frames.length;
    const avgEnergy =
      frames.reduce((sum, f) => sum + f.energy, 0) / frames.length;

    // Compute pitch variance
    const pitchMean = avgPitch;
    const pitchVariance = Math.sqrt(
      frames.reduce((sum, f) => sum + Math.pow(f.pitchHz - pitchMean, 2), 0) /
        frames.length
    );

    // Determine dominant emotion (most frequent)
    const emotionCounts: Record<string, number> = {};
    frames.forEach((f) => {
      emotionCounts[f.emotion] = (emotionCounts[f.emotion] || 0) + 1;
    });
    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    ) as EmotionLevel;

    return {
      pitchHz: avgPitch,
      energy: avgEnergy,
      emotion: dominantEmotion,
      pitchVariance,
    };
  }

  /**
   * Compute memory retention weight based on emotion intensity
   * High emotion = longer retention, low emotion = shorter TTL
   *
   * Returns TTL in days
   */
  computeRetentionTTL(emotionIntensity: number): number {
    // Emotion intensity mapping to TTL (days)
    // 0.1 (detached) → 7 days
    // 0.3 (low) → 14 days
    // 0.5 (neutral) → 30 days
    // 0.9 (high) → 90 days

    const minTTL = 7; // Minimum retention
    const maxTTL = 90; // Maximum retention
    const range = maxTTL - minTTL;

    // Exponential curve: high emotion gets disproportionately longer TTL
    const ttl = minTTL + range * Math.pow(emotionIntensity, 1.5);

    return Math.round(ttl);
  }

  /**
   * Compute emotion-weighted memory score
   * Formula: score = semantic_similarity * (1 + emotion_intensity * boost_factor)
   *
   * Example:
   * - High emotion (0.9) + high similarity (0.8) → 0.8 * (1 + 0.9 * 0.5) = 1.16
   * - Low emotion (0.2) + high similarity (0.8) → 0.8 * (1 + 0.2 * 0.5) = 0.88
   */
  computeEmotionWeightedScore(
    semanticSimilarity: number,
    emotionIntensity: number,
    boostFactor: number = 0.5
  ): number {
    return semanticSimilarity * (1 + emotionIntensity * boostFactor);
  }

  /**
   * Compute hybrid similarity score (text + prosody)
   * Weights: 70% text similarity, 30% prosody similarity
   */
  computeHybridScore(
    textSimilarity: number,
    prosodySimilarity: number,
    textWeight: number = 0.7,
    prosodyWeight: number = 0.3
  ): number {
    return textSimilarity * textWeight + prosodySimilarity * prosodyWeight;
  }
}

export const prosodyEmbeddingService = new ProsodyEmbeddingService();
export { ProsodyData, ProsodyVector };

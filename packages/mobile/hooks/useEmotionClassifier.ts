/**
 * useEmotionClassifier Hook
 *
 * React Native hook for classifying emotions (Calm, Guarded, Lit)
 * and applying modulation parameters to TTS and avatar
 */

import { useState, useCallback } from "react";
import axios from "axios";

export type EmotionCategory = "calm" | "guarded" | "lit";

export interface EmotionFeatures {
  transcript: string;
  pitch_contour?: number[];
  energy_curve?: number[];
  speech_rate?: number;
  pause_durations?: number[];
  prosody_summary?: string;
  lexical_tone_indicators?: string[];
}

export interface ModulationParams {
  tts_pitch_shift: number;
  tts_speed_scale: number;
  glow_intensity: number;
  glow_easing_curve: "sine" | "ease-in" | "cubic";
}

export interface EmotionClassification {
  emotion_category: EmotionCategory;
  confidence: number;
  modulation_params: ModulationParams;
}

interface UseEmotionClassifierReturn {
  classify: (
    features: EmotionFeatures
  ) => Promise<EmotionClassification | null>;
  classifyBatch: (
    featuresArray: EmotionFeatures[]
  ) => Promise<EmotionClassification[]>;
  classification: EmotionClassification | null;
  isClassifying: boolean;
  error: string | null;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function useEmotionClassifier(): UseEmotionClassifierReturn {
  const [classification, setClassification] =
    useState<EmotionClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classify = useCallback(
    async (
      features: EmotionFeatures
    ): Promise<EmotionClassification | null> => {
      setIsClassifying(true);
      setError(null);

      try {
        const response = await axios.post<EmotionClassification>(
          `${API_BASE_URL}/api/emotion/classify`,
          {
            transcript: features.transcript,
            features: {
              pitch_contour: features.pitch_contour,
              energy_curve: features.energy_curve,
              speech_rate: features.speech_rate,
              pause_durations: features.pause_durations,
              prosody_summary: features.prosody_summary,
              lexical_tone_indicators: features.lexical_tone_indicators,
            },
          }
        );

        setClassification(response.data);
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to classify emotion";
        setError(errorMessage);
        console.error("Emotion classification error:", err);
        return null;
      } finally {
        setIsClassifying(false);
      }
    },
    []
  );

  const classifyBatch = useCallback(
    async (
      featuresArray: EmotionFeatures[]
    ): Promise<EmotionClassification[]> => {
      setIsClassifying(true);
      setError(null);

      try {
        const items = featuresArray.map((features) => ({
          transcript: features.transcript,
          features: {
            pitch_contour: features.pitch_contour,
            energy_curve: features.energy_curve,
            speech_rate: features.speech_rate,
            pause_durations: features.pause_durations,
            prosody_summary: features.prosody_summary,
            lexical_tone_indicators: features.lexical_tone_indicators,
          },
        }));

        const response = await axios.post<{
          count: number;
          results: EmotionClassification[];
        }>(`${API_BASE_URL}/api/emotion/classify/batch`, { items });

        return response.data.results;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to classify emotions";
        setError(errorMessage);
        console.error("Batch emotion classification error:", err);
        return [];
      } finally {
        setIsClassifying(false);
      }
    },
    []
  );

  return {
    classify,
    classifyBatch,
    classification,
    isClassifying,
    error,
  };
}

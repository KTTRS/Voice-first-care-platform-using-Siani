/**
 * Emotion-Synchronized Response Hook
 *
 * Integrates emotion classification with TTS and avatar animation
 * Classifies user's emotion and applies modulation to Siani's response
 */

import { useState, useCallback } from "react";
import * as Speech from "expo-speech";
import {
  useEmotionClassifier,
  EmotionFeatures,
  EmotionClassification,
} from "./useEmotionClassifier";

interface EmotionSyncConfig {
  applyToTTS?: boolean;
  applyToAvatar?: boolean;
  onEmotionDetected?: (classification: EmotionClassification) => void;
}

interface UseEmotionSyncReturn {
  processWithEmotion: (
    transcript: string,
    prosodyData?: Partial<EmotionFeatures>,
    responseText?: string
  ) => Promise<void>;
  currentEmotion: EmotionClassification | null;
  isProcessing: boolean;
  error: string | null;
}

export function useEmotionSync(
  config: EmotionSyncConfig = {}
): UseEmotionSyncReturn {
  const { applyToTTS = true, applyToAvatar = true, onEmotionDetected } = config;

  const {
    classify,
    classification,
    isClassifying,
    error: classifyError,
  } = useEmotionClassifier();

  const [currentEmotion, setCurrentEmotion] =
    useState<EmotionClassification | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processWithEmotion = useCallback(
    async (
      transcript: string,
      prosodyData?: Partial<EmotionFeatures>,
      responseText?: string
    ) => {
      setError(null);

      try {
        // Step 1: Classify emotion from user's speech
        const features: EmotionFeatures = {
          transcript,
          ...prosodyData,
        };

        const emotionResult = await classify(features);

        if (!emotionResult) {
          throw new Error("Failed to classify emotion");
        }

        setCurrentEmotion(emotionResult);

        // Step 2: Trigger callback
        if (onEmotionDetected) {
          onEmotionDetected(emotionResult);
        }

        // Step 3: Apply modulation to TTS (if response provided)
        if (responseText && applyToTTS) {
          const { modulation_params } = emotionResult;

          setIsSpeaking(true);

          // Speak with emotion-synchronized parameters
          await Speech.speak(responseText, {
            pitch: 1.0 + modulation_params.tts_pitch_shift,
            rate: modulation_params.tts_speed_scale,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
          });
        }

        // Step 4: Apply to avatar (handled via callback or state)
        // Avatar animation can read currentEmotion.modulation_params.glow_intensity
        // and glow_easing_curve

        console.log(
          `🎭 Emotion detected: ${emotionResult.emotion_category} (${(
            emotionResult.confidence * 100
          ).toFixed(0)}% confidence)`
        );
        console.log(
          `🎚️ Modulation: pitch=${emotionResult.modulation_params.tts_pitch_shift}, speed=${emotionResult.modulation_params.tts_speed_scale}, glow=${emotionResult.modulation_params.glow_intensity}`
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Emotion sync failed";
        setError(errorMessage);
        console.error("Emotion sync error:", err);
      }
    },
    [classify, applyToTTS, onEmotionDetected]
  );

  return {
    processWithEmotion,
    currentEmotion,
    isProcessing: isClassifying || isSpeaking,
    error: error || classifyError,
  };
}

// Example usage:
/*
const ConversationScreen = () => {
  const { processWithEmotion, currentEmotion } = useEmotionSync({
    applyToTTS: true,
    applyToAvatar: true,
    onEmotionDetected: (classification) => {
      // Update avatar glow based on user's emotion
      updateAvatarGlow(
        classification.modulation_params.glow_intensity,
        classification.modulation_params.glow_easing_curve
      );
    },
  });

  const handleUserSpeech = async (transcript: string, prosody: any) => {
    // Classify user's emotion and respond with synchronized TTS/avatar
    await processWithEmotion(
      transcript,
      {
        pitch_contour: prosody.pitchContour,
        energy_curve: prosody.energyCurve,
        speech_rate: prosody.speechRate,
      },
      "I hear you. That sounds really challenging." // Siani's response
    );
  };

  return (
    <View>
      <SianiAvatar
        emotion={currentEmotion?.emotion_category || 'neutral'}
        glowIntensity={currentEmotion?.modulation_params.glow_intensity || 0.4}
        easingCurve={currentEmotion?.modulation_params.glow_easing_curve || 'sine'}
      />
    </View>
  );
};
*/

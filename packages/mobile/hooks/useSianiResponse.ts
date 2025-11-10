import { useState, useCallback } from "react";

export type EmotionLevel =
  | "high"
  | "low"
  | "detached"
  | "neutral"
  | "anxious"
  | "calm";
export type Intent =
  | "ask-for-help"
  | "journal"
  | "express-gratitude"
  | "share-struggle"
  | "unknown";

interface VoiceAnalysisResult {
  transcription: string;
  emotion: EmotionLevel;
  intent: Intent;
  intensity: number;
  engagement: {
    wordCount: number;
    sentenceCount: number;
    questionCount: number;
    engagementLevel: "high" | "medium" | "low";
  };
  sianiResponse: string;
  sdohFlags: string[];
  needsIntervention: boolean;
  memoryMomentId: string;
  timestamp: string;
}

/**
 * Hook for managing Siani's emotional responses to voice input
 *
 * Usage:
 * ```tsx
 * const { sianiMessage, showSianiGlow, processSianiResponse } = useSianiResponse();
 *
 * // After voice analysis
 * processSianiResponse(analysisResult);
 * ```
 */
export function useSianiResponse() {
  const [sianiMessage, setSianiMessage] = useState<string | null>(null);
  const [showSianiGlow, setShowSianiGlow] = useState(false);
  const [glowColor, setGlowColor] = useState("#9C27B0"); // Default purple
  const [currentEmotion, setCurrentEmotion] = useState<EmotionLevel>("neutral");

  /**
   * Process voice analysis result and trigger Siani's response
   */
  const processSianiResponse = useCallback((result: VoiceAnalysisResult) => {
    // Set the response message
    setSianiMessage(result.sianiResponse);

    // Set emotion state
    setCurrentEmotion(result.emotion);

    // Determine glow color based on emotion
    const color = getGlowColor(result.emotion);
    setGlowColor(color);

    // Trigger glow animation
    setShowSianiGlow(true);

    // Auto-hide glow after 5 seconds
    setTimeout(() => {
      setShowSianiGlow(false);
    }, 5000);

    // Log intervention needs
    if (result.needsIntervention) {
      console.warn("[Siani] Crisis intervention needed - alerting care team");
      // TODO: Trigger crisis intervention flow
    }

    // Log SDOH needs
    if (result.sdohFlags.length > 0) {
      console.log("[Siani] SDOH needs detected:", result.sdohFlags);
      // TODO: Trigger resource recommendation flow
    }
  }, []);

  /**
   * Clear Siani's message
   */
  const clearSianiMessage = useCallback(() => {
    setSianiMessage(null);
    setShowSianiGlow(false);
  }, []);

  /**
   * Manually trigger Siani glow (for other interactions)
   */
  const triggerSianiGlow = useCallback(
    (emotion: EmotionLevel, duration: number = 3000) => {
      setGlowColor(getGlowColor(emotion));
      setShowSianiGlow(true);
      setTimeout(() => setShowSianiGlow(false), duration);
    },
    []
  );

  return {
    sianiMessage,
    showSianiGlow,
    glowColor,
    currentEmotion,
    processSianiResponse,
    clearSianiMessage,
    triggerSianiGlow,
  };
}

/**
 * Get glow color based on emotion
 */
function getGlowColor(emotion: EmotionLevel): string {
  switch (emotion) {
    case "high":
      return "#FFD700"; // Gold for positive/excited
    case "calm":
      return "#4CAF50"; // Green for calm
    case "anxious":
      return "#FF9800"; // Orange for anxious
    case "low":
      return "#2196F3"; // Blue for sad/low
    case "detached":
      return "#9E9E9E"; // Gray for detached
    case "neutral":
    default:
      return "#9C27B0"; // Purple for neutral
  }
}

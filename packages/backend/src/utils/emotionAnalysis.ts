/**
 * Emotion Analysis Utilities
 * Analyzes text to detect emotional state and intent
 */

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

/**
 * Analyze emotion from transcribed text
 * Uses keyword matching and sentiment indicators
 */
export function analyzeEmotion(text: string): EmotionLevel {
  const lowered = text.toLowerCase();

  // Low/depressed indicators
  const lowKeywords = [
    "sad",
    "tired",
    "exhausted",
    "depressed",
    "hopeless",
    "down",
    "crying",
    "alone",
  ];
  if (lowKeywords.some((keyword) => lowered.includes(keyword))) {
    return "low";
  }

  // High/excited indicators
  const highKeywords = [
    "excited",
    "hopeful",
    "happy",
    "great",
    "wonderful",
    "amazing",
    "love",
    "grateful",
  ];
  if (highKeywords.some((keyword) => lowered.includes(keyword))) {
    return "high";
  }

  // Detached/numb indicators
  const detachedKeywords = [
    "numb",
    "lost",
    "empty",
    "nothing",
    "don't feel",
    "disconnected",
  ];
  if (detachedKeywords.some((keyword) => lowered.includes(keyword))) {
    return "detached";
  }

  // Anxious indicators
  const anxiousKeywords = [
    "worried",
    "stressed",
    "anxious",
    "nervous",
    "scared",
    "afraid",
    "panic",
  ];
  if (anxiousKeywords.some((keyword) => lowered.includes(keyword))) {
    return "anxious";
  }

  // Calm indicators
  const calmKeywords = [
    "calm",
    "peaceful",
    "relaxed",
    "okay",
    "fine",
    "better",
  ];
  if (calmKeywords.some((keyword) => lowered.includes(keyword))) {
    return "calm";
  }

  return "neutral";
}

/**
 * Detect user intent from transcribed text
 */
export function detectIntent(text: string): Intent {
  const lowered = text.toLowerCase();

  // Ask for help
  const helpKeywords = [
    "need help",
    "can you",
    "help me",
    "don't know",
    "what should",
    "how do i",
  ];
  if (helpKeywords.some((keyword) => lowered.includes(keyword))) {
    return "ask-for-help";
  }

  // Express gratitude
  const gratitudeKeywords = [
    "thank you",
    "grateful",
    "appreciate",
    "blessed",
    "thankful",
  ];
  if (gratitudeKeywords.some((keyword) => lowered.includes(keyword))) {
    return "express-gratitude";
  }

  // Share struggle
  const struggleKeywords = [
    "struggling",
    "hard time",
    "difficult",
    "can't",
    "impossible",
    "giving up",
  ];
  if (struggleKeywords.some((keyword) => lowered.includes(keyword))) {
    return "share-struggle";
  }

  // Journal entry (reflection)
  const journalKeywords = [
    "today i",
    "yesterday",
    "this morning",
    "felt",
    "thinking about",
  ];
  if (journalKeywords.some((keyword) => lowered.includes(keyword))) {
    return "journal";
  }

  return "unknown";
}

/**
 * Generate Siani's empathetic response based on emotion and intent
 */
export function generateSianiResponse(
  emotion: EmotionLevel,
  intent: Intent,
  transcript: string
): string {
  // Intent-based responses
  if (intent === "ask-for-help") {
    return "I'm here — want me to pull up resources?";
  }

  if (intent === "express-gratitude") {
    return "I see that gratitude in you. It's beautiful. 💜";
  }

  if (intent === "share-struggle") {
    return "I'm holding this with you. You don't have to carry it alone.";
  }

  // Emotion-based responses
  if (emotion === "low") {
    return "That sounds like a heavy moment. I'm here, and I'm listening.";
  }

  if (emotion === "anxious") {
    return "I can feel that tension. Take a breath with me — you're safe right now.";
  }

  if (emotion === "detached") {
    return "Sometimes numbness is protection. I'm here when you're ready to feel again.";
  }

  if (emotion === "high") {
    return "I love seeing this spark in you! Tell me more. ✨";
  }

  if (emotion === "calm") {
    return "This peaceful energy — hold onto it. You deserve this moment.";
  }

  // Default response
  if (intent === "journal") {
    return "I'm listening. Keep going...";
  }

  return "I'm here with you.";
}

/**
 * Determine if immediate intervention is needed based on content
 */
export function needsImmediateIntervention(text: string): boolean {
  const lowered = text.toLowerCase();

  const crisisKeywords = [
    "want to die",
    "kill myself",
    "end it all",
    "suicide",
    "hurt myself",
    "no reason to live",
    "better off dead",
  ];

  return crisisKeywords.some((keyword) => lowered.includes(keyword));
}

/**
 * Calculate emotion intensity (0-10)
 */
export function calculateEmotionIntensity(
  text: string,
  emotion: EmotionLevel
): number {
  const lowered = text.toLowerCase();

  // Intensity modifiers
  const highIntensityWords = [
    "very",
    "extremely",
    "really",
    "so",
    "incredibly",
  ];
  const lowIntensityWords = [
    "a bit",
    "kind of",
    "sort of",
    "slightly",
    "somewhat",
  ];

  let intensity = 5; // baseline

  // Increase for high intensity modifiers
  if (highIntensityWords.some((word) => lowered.includes(word))) {
    intensity += 2;
  }

  // Decrease for low intensity modifiers
  if (lowIntensityWords.some((word) => lowered.includes(word))) {
    intensity -= 2;
  }

  // Emotion-specific adjustments
  if (emotion === "low" || emotion === "anxious") {
    // Check for extreme language
    if (lowered.includes("can't") || lowered.includes("never")) {
      intensity += 1;
    }
  }

  if (emotion === "detached") {
    // Detachment often indicates higher severity
    intensity += 1;
  }

  return Math.max(0, Math.min(10, intensity));
}

/**
 * Analyze conversation patterns for engagement tracking
 */
export function analyzeEngagement(text: string): {
  wordCount: number;
  sentenceCount: number;
  questionCount: number;
  engagementLevel: "high" | "medium" | "low";
} {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  const questions = (text.match(/\?/g) || []).length;

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const questionCount = questions;

  // Determine engagement level
  let engagementLevel: "high" | "medium" | "low";
  if (wordCount > 50 || sentenceCount > 3) {
    engagementLevel = "high";
  } else if (wordCount > 20 || sentenceCount > 1) {
    engagementLevel = "medium";
  } else {
    engagementLevel = "low";
  }

  return {
    wordCount,
    sentenceCount,
    questionCount,
    engagementLevel,
  };
}

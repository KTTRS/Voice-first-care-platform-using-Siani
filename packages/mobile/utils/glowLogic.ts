import { EmotionState } from "../store/emotionStore";

/**
 * Glow Configuration for Real-Time Emotional Feedback
 *
 * Maps emotion states to color, intensity, and animation curves
 * Based on detected emotion levels: low, neutral, high, detached
 */

export interface GlowConfig {
  color: string;
  secondaryColor: string;
  intensity: number;
  pulseSpeed: number; // ms per cycle
  waveAmplitude: number; // 0-1 scale range
}

export const GLOW_MAP: Record<EmotionState, GlowConfig> = {
  calm: {
    color: "#FFB6B6", // Soft blush pink
    secondaryColor: "#FFD4D4",
    intensity: 0.5,
    pulseSpeed: 2000, // Slow, gentle
    waveAmplitude: 0.3,
  },
  anxious: {
    color: "#FFC14D", // Warm amber
    secondaryColor: "#FFE5B3",
    intensity: 0.7,
    pulseSpeed: 800, // Faster, more urgent
    waveAmplitude: 0.5,
  },
  motivated: {
    color: "#9CFFB0", // Fresh mint green
    secondaryColor: "#DAA520", // Gold accent
    intensity: 0.9,
    pulseSpeed: 1200, // Energetic
    waveAmplitude: 0.6,
  },
  neutral: {
    color: "#FFD580", // Gentle gold
    secondaryColor: "#FFEABB",
    intensity: 0.4,
    pulseSpeed: 2500, // Very slow
    waveAmplitude: 0.2,
  },
};

/**
 * Sine-wave opacity function for smooth pulsing
 * Creates organic, breathing effect
 */
export function calculateGlowOpacity(
  time: number,
  baseIntensity: number,
  amplitude: number,
  speed: number
): number {
  const phase = (time % speed) / speed; // 0-1 normalized
  const sine = Math.sin(phase * 2 * Math.PI);
  const normalized = (sine + 1) / 2; // Convert -1,1 to 0,1
  return baseIntensity + (normalized - 0.5) * amplitude;
}

/**
 * Avatar state machine for voice pipeline integration
 */
export type AvatarState =
  | "idle" // Quiet, subtle glow
  | "listening" // Rhythmic heartbeat glow + haptic
  | "processing" // Shimmer effect
  | "responding" // Pulse tied to TTS waveform
  | "thinking"; // Pre-response delay (250-400ms)

export interface AvatarStateConfig {
  glowIntensity: number;
  pulseSpeed: number;
  hapticPattern?: "heartbeat" | "shimmer" | "pulse" | "none";
  microAnimation?: "breathe" | "lean" | "flicker" | "tighten";
}

export const AVATAR_STATE_MAP: Record<AvatarState, AvatarStateConfig> = {
  idle: {
    glowIntensity: 0.3,
    pulseSpeed: 3000,
    hapticPattern: "none",
    microAnimation: "breathe",
  },
  listening: {
    glowIntensity: 0.6,
    pulseSpeed: 1500,
    hapticPattern: "heartbeat",
    microAnimation: "breathe",
  },
  processing: {
    glowIntensity: 0.5,
    pulseSpeed: 800,
    hapticPattern: "shimmer",
    microAnimation: "flicker",
  },
  thinking: {
    glowIntensity: 0.7,
    pulseSpeed: 400,
    hapticPattern: "none",
    microAnimation: "tighten",
  },
  responding: {
    glowIntensity: 0.8,
    pulseSpeed: 1000,
    hapticPattern: "pulse",
    microAnimation: "lean",
  },
};

/**
 * Pre-response delay configuration
 * Creates anticipation before Siani responds
 */
export const PRE_RESPONSE_DELAY_MS = 300;

/**
 * Micro-animation spring configuration
 * Used for subtle scale, tilt, and position shifts
 */
export const MICRO_ANIMATION_CONFIG = {
  breathe: {
    scale: [1, 1.03, 1],
    duration: 3000,
  },
  lean: {
    rotate: [0, 2, 0], // degrees
    duration: 1500,
  },
  flicker: {
    opacity: [1, 0.85, 1, 0.9, 1],
    duration: 800,
  },
  tighten: {
    scale: [1, 0.97, 1.02],
    duration: 400,
  },
};

/**
 * Haptic feedback event bus for BLE devices (future)
 * Placeholder for wearable integration
 */
export class HapticEventBus {
  private subscribers: Map<string, (event: HapticEvent) => void> = new Map();

  subscribe(id: string, callback: (event: HapticEvent) => void) {
    this.subscribers.set(id, callback);
  }

  unsubscribe(id: string) {
    this.subscribers.delete(id);
  }

  emit(event: HapticEvent) {
    this.subscribers.forEach((callback) => callback(event));
  }
}

export interface HapticEvent {
  type: "glow" | "pulse" | "heartbeat" | "shimmer";
  intensity: number;
  duration: number;
  emotion?: EmotionState;
}

export const hapticEventBus = new HapticEventBus();

/**
 * TTS waveform amplitude normalization
 * For syncing avatar pulse with voice output
 */
export function normalizeAudioGain(
  amplitude: number,
  minGain: number = 0.3,
  maxGain: number = 1.0
): number {
  // Normalize 0-1 amplitude to minGain-maxGain range
  return minGain + amplitude * (maxGain - minGain);
}

/**
 * Calculate emotion level from transcription sentiment
 * Maps sentiment score to emotion intensity
 */
export function calculateEmotionLevel(
  sentiment: number, // -1 to 1
  keywords: string[]
): "low" | "neutral" | "high" | "detached" {
  // Count strong emotional keywords
  const strongKeywords = [
    "crisis",
    "emergency",
    "desperate",
    "hopeless",
    "amazing",
    "wonderful",
    "excited",
    "thrilled",
  ];
  const strongCount = keywords.filter((k) =>
    strongKeywords.includes(k.toLowerCase())
  ).length;

  if (strongCount >= 2) {
    return sentiment > 0 ? "high" : "low";
  }

  if (Math.abs(sentiment) < 0.2) {
    return "neutral";
  }

  if (sentiment < -0.6) {
    return "detached"; // Very negative, withdrawn
  }

  return sentiment < 0 ? "low" : sentiment > 0.6 ? "high" : "neutral";
}

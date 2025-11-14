/**
 * Siani Intelligence Service
 *
 * Orchestrates the integration between:
 * - Relational Memory (emotional context, trust, continuity)
 * - Signal Engine (risk scoring, trust delta)
 * - Memory Service (storage with emotion + prosody)
 * - TTS/Prosody (dynamic tone selection)
 *
 * This service ensures all layers communicate and share state for
 * coherent, emotionally-aware interactions.
 */

import { relationalMemoryService } from "./relationalMemory.service";
import { processUserSignal } from "./signalEngine.service";
import { createMemoryMoment } from "./memoryMoment.service";
import { ProsodyData } from "./prosodyEmbedding.service";
import { EmotionLevel } from "../utils/emotionAnalysis";
import prisma from "../utils/db";

/**
 * Voice interaction data from user
 */
export interface VoiceInteraction {
  userId: string;
  transcript: string;
  audioData?: Buffer;
  prosodyData?: ProsodyData;
  detectedEmotion?: EmotionLevel;
}

/**
 * Siani's response with emotional intelligence
 */
export interface SianiResponse {
  text: string;
  emotion: EmotionLevel;
  emotionVector: number[]; // [calm, guarded, lit]
  tone: "warm" | "gentle" | "energetic" | "supportive" | "empathetic";
  prosodyConfig: {
    pitch: number; // -20 to +20 semitones
    speakingRate: number; // 0.25 to 4.0
    volumeGain: number; // -96 to +16 dB
  };
  relationalContext: {
    trustLevel: number;
    familiarity: number;
    continuity: number;
  };
  contextualMemories: any[];
}

/**
 * Process a voice interaction through the full intelligence pipeline:
 * 1. Classify emotion from voice/text
 * 2. Retrieve relational context
 * 3. Store in memory with emotion + prosody
 * 4. Update signal score (trust delta, emotion intensity)
 * 5. Generate emotionally-aware response
 */
export async function processVoiceInteraction(
  interaction: VoiceInteraction
): Promise<SianiResponse> {
  const { userId, transcript, prosodyData, detectedEmotion } = interaction;

  // Step 1: Classify emotion (use detected or infer from prosody/text)
  const emotion = detectedEmotion || inferEmotionFromProsody(prosodyData);
  const emotionVector = mapEmotionToVector(emotion);

  // Step 2: Extract topics from transcript
  const topics = extractTopics(transcript);

  // Step 3: Retrieve relational context (similar past conversations)
  const context = await relationalMemoryService.retrieveContext(
    userId,
    transcript,
    emotion,
    emotionVector,
    5
  );

  // Step 4: Store conversation in relational memory
  await relationalMemoryService.storeConversation(
    userId,
    transcript,
    emotion,
    emotionVector,
    topics,
    prosodyData
  );

  // Step 5: Store in memory moments (for signal engine)
  const tone = selectToneFromEmotion(emotion, context.relationalCues);
  await createMemoryMoment(
    {
      userId,
      content: transcript,
      emotion,
      tone,
      vectorId: `vec_${Date.now()}`,
      source: "voice",
      metadata: {
        emotionVector,
        topics,
        prosodyData: prosodyData
          ? {
              pitchHz: prosodyData.pitchHz,
              energy: prosodyData.energy,
              emotion: prosodyData.emotion,
            }
          : null,
        trustLevel: context.relationalCues.trustLevel,
        resonance: context.relationalCues.familiarity,
      },
    },
    prosodyData
  );

  // Step 6: Update signal score with trust delta and emotion intensity
  await updateSignalWithRelationalContext(userId, emotion, context);

  // Step 7: Generate Siani's response
  const responseText = await generateContextualResponse(
    transcript,
    emotion,
    context
  );

  // Step 8: Select prosody config for TTS based on user's emotional state
  const prosodyConfig = selectProsodyConfig(
    emotion,
    context.relationalCues,
    context.emotionalContext
  );

  return {
    text: responseText,
    emotion: selectSianiEmotion(emotion, context),
    emotionVector,
    tone,
    prosodyConfig,
    relationalContext: context.relationalCues,
    contextualMemories: context.memories,
  };
}

/**
 * Update signal score with relational context
 * Adds trust_delta and emotion_intensity to signal calculation
 */
async function updateSignalWithRelationalContext(
  userId: string,
  emotion: EmotionLevel,
  context: any
): Promise<void> {
  try {
    // Calculate trust delta based on vulnerability
    const vulnerabilityBoost = getVulnerabilityBoost(emotion);
    const trustDelta = vulnerabilityBoost * 0.1; // Max +0.1 per interaction

    // Get current signal score
    const currentScore = await prisma.signalScore.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (currentScore) {
      // Update system trust score based on relational trust
      const updatedSystemTrust = Math.max(
        0,
        Math.min(
          10,
          currentScore.systemTrust - trustDelta * 10 // Higher trust = lower risk
        )
      );

      // Update mental health risk based on emotion intensity
      const emotionIntensityRisk = calculateEmotionRisk(emotion);
      const updatedMentalHealth = Math.max(
        0,
        Math.min(
          10,
          currentScore.mentalHealthRisk * 0.7 + emotionIntensityRisk * 0.3
        )
      );

      await prisma.signalScore.update({
        where: { id: currentScore.id },
        data: {
          systemTrust: updatedSystemTrust,
          mentalHealthRisk: updatedMentalHealth,
          // Store trust delta in metadata for tracking
          lastActivityAt: new Date(),
        },
      });

      console.log(
        `✅ Signal updated for ${userId}: trust Δ=${trustDelta.toFixed(
          3
        )}, emotion=${emotion}`
      );
    } else {
      // No existing score, trigger full signal analysis
      await processUserSignal(userId);
    }
  } catch (error) {
    console.error("Error updating signal with relational context:", error);
  }
}

/**
 * Map emotion to 3D vector [calm, guarded, lit]
 */
function mapEmotionToVector(emotion: EmotionLevel): number[] {
  const emotionVectorMap: Record<EmotionLevel, number[]> = {
    calm: [0.8, 0.1, 0.1],
    neutral: [0.5, 0.3, 0.2],
    anxious: [0.2, 0.7, 0.1],
    guarded: [0.2, 0.7, 0.1],
    low: [0.3, 0.6, 0.1],
    detached: [0.1, 0.8, 0.1],
    high: [0.3, 0.2, 0.5],
    lit: [0.2, 0.1, 0.7],
  };

  return emotionVectorMap[emotion] || [0.33, 0.34, 0.33];
}

/**
 * Infer emotion from prosody data
 */
function inferEmotionFromProsody(prosodyData?: ProsodyData): EmotionLevel {
  if (!prosodyData) return "neutral";

  const { pitchHz, energy } = prosodyData;

  // High energy + high pitch = lit
  if (energy > 0.7 && pitchHz > 250) {
    return "lit";
  }

  // Low energy + low pitch = low/detached
  if (energy < 0.3 && pitchHz < 150) {
    return "low";
  }

  // High pitch + moderate energy = anxious/guarded
  if (energy > 0.5 && pitchHz > 200) {
    return "anxious";
  }

  // Moderate energy + moderate pitch = calm
  if (energy > 0.4 && energy < 0.6 && pitchHz < 180) {
    return "calm";
  }

  return "neutral";
}

/**
 * Extract topics from transcript using keyword matching
 */
function extractTopics(transcript: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    work: ["job", "work", "career", "boss", "deadline", "project"],
    health: ["health", "doctor", "medication", "pain", "sick", "medical"],
    housing: ["house", "housing", "home", "apartment", "rent", "lease"],
    family: ["family", "mom", "dad", "parent", "child", "kids", "relative"],
    finance: ["money", "bill", "debt", "bank", "loan", "expense", "budget"],
    mental_health: [
      "anxious",
      "depressed",
      "stressed",
      "worried",
      "overwhelmed",
      "therapy",
    ],
    social: ["friend", "lonely", "isolated", "alone", "social", "people"],
  };

  const topics: string[] = [];
  const lowered = transcript.toLowerCase();

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics : ["general"];
}

/**
 * Select tone based on emotion and relational context
 */
function selectToneFromEmotion(
  emotion: EmotionLevel,
  relationalCues: any
): "warm" | "gentle" | "energetic" | "supportive" | "empathetic" {
  const { trustLevel } = relationalCues;

  // High trust = more warmth
  if (trustLevel > 0.7) {
    if (emotion === "lit" || emotion === "high") return "energetic";
    if (emotion === "calm") return "warm";
    return "supportive";
  }

  // Low trust = more gentle/empathetic
  if (emotion === "low" || emotion === "detached") return "empathetic";
  if (emotion === "anxious" || emotion === "guarded") return "gentle";

  return "supportive";
}

/**
 * Get vulnerability boost for trust calculation
 */
function getVulnerabilityBoost(emotion: EmotionLevel): number {
  const vulnerabilityMap: Record<EmotionLevel, number> = {
    low: 0.8,
    anxious: 0.7,
    guarded: 0.6,
    neutral: 0.3,
    calm: 0.5,
    high: 0.4,
    detached: 0.2,
    lit: 0.5,
  };

  return vulnerabilityMap[emotion] || 0.3;
}

/**
 * Calculate emotion risk for mental health scoring
 */
function calculateEmotionRisk(emotion: EmotionLevel): number {
  const riskMap: Record<EmotionLevel, number> = {
    low: 8, // High risk
    detached: 7,
    anxious: 6,
    guarded: 5,
    neutral: 4,
    calm: 2,
    high: 3,
    lit: 2, // Low risk
  };

  return riskMap[emotion] || 4;
}

/**
 * Select Siani's emotion for response (mirror or balance user's emotion)
 */
function selectSianiEmotion(
  userEmotion: EmotionLevel,
  context: any
): EmotionLevel {
  const { trustLevel, familiarity } = context.relationalCues;

  // High trust + familiarity = mirror emotion
  if (trustLevel > 0.7 && familiarity > 0.7) {
    if (userEmotion === "lit") return "high"; // Match energy
    if (userEmotion === "calm") return "calm";
  }

  // Low/anxious emotions = respond with calm support
  if (userEmotion === "low" || userEmotion === "anxious") {
    return "calm";
  }

  // Guarded = gentle warmth
  if (userEmotion === "guarded") {
    return "calm";
  }

  return "neutral";
}

/**
 * Select prosody configuration for TTS
 */
function selectProsodyConfig(
  userEmotion: EmotionLevel,
  relationalCues: any,
  emotionalContext: any
): {
  pitch: number;
  speakingRate: number;
  volumeGain: number;
} {
  const { trustLevel } = relationalCues;

  // Base config
  let pitch = 0; // Neutral
  let speakingRate = 1.0; // Normal
  let volumeGain = 0; // Normal volume

  // Adjust based on user's emotion
  if (userEmotion === "anxious" || userEmotion === "guarded") {
    // Calm, slower, slightly lower pitch
    pitch = -2;
    speakingRate = 0.9;
    volumeGain = -2; // Slightly softer
  } else if (userEmotion === "low" || userEmotion === "detached") {
    // Warm, gentle, normal pace
    pitch = 1; // Slightly higher for warmth
    speakingRate = 0.95;
    volumeGain = 0;
  } else if (userEmotion === "lit" || userEmotion === "high") {
    // Match energy but don't overdo it
    pitch = 2;
    speakingRate = 1.1;
    volumeGain = 1;
  } else {
    // Neutral/calm
    pitch = 0;
    speakingRate = 1.0;
    volumeGain = 0;
  }

  // Adjust for trust level (higher trust = more expressiveness)
  if (trustLevel > 0.7) {
    speakingRate *= 1.05; // Slightly more animated
    volumeGain += 1; // Slightly more presence
  } else if (trustLevel < 0.4) {
    speakingRate *= 0.95; // More measured
    volumeGain -= 1; // More gentle
  }

  return {
    pitch: Math.max(-20, Math.min(20, pitch)),
    speakingRate: Math.max(0.25, Math.min(4.0, speakingRate)),
    volumeGain: Math.max(-96, Math.min(16, volumeGain)),
  };
}

/**
 * Generate contextual response using relational memory
 */
async function generateContextualResponse(
  transcript: string,
  emotion: EmotionLevel,
  context: any
): Promise<string> {
  // Use the contextPrompt from relational memory
  const { contextPrompt, emotionalContext, relationalCues } = context;

  // Build response based on emotional state and context
  let response = "";

  // Acknowledge trust and continuity
  if (relationalCues.trustLevel > 0.7 && relationalCues.continuity > 0.6) {
    response += "I remember we've talked about this before. ";
  }

  // Emotional validation
  if (emotion === "anxious" || emotion === "guarded") {
    response += "I can sense that tension. Take a breath with me. ";
  } else if (emotion === "low" || emotion === "detached") {
    response += "I'm here with you in this. You don't have to carry it alone. ";
  } else if (emotion === "lit" || emotion === "high") {
    response += "I love seeing this energy in you! ";
  } else if (emotion === "calm") {
    response += "This peaceful energy — hold onto it. ";
  }

  // Add context from similar past moments
  if (context.memories.length > 0) {
    response += "This reminds me of when you shared similar feelings before. ";
  }

  // Default supportive close
  response += "What feels most important to focus on right now?";

  return response;
}

export const sianiIntelligenceService = {
  processVoiceInteraction,
};

/**
 * Siani Intelligence API Routes
 *
 * Orchestrates full voice interaction pipeline:
 * - Voice/text input → Emotion classification
 * - Relational memory retrieval
 * - Signal engine updates (trust delta, emotion intensity)
 * - Contextual response generation with dynamic prosody
 */

import { Router, Request, Response } from "express";
import { sianiIntelligenceService } from "../services/sianiIntelligence.service";
import { ProsodyData } from "../services/prosodyEmbedding.service";

const router = Router();

/**
 * POST /api/siani/interact
 * Process a complete voice interaction
 *
 * Body:
 * {
 *   userId: string;
 *   transcript: string;
 *   audioData?: Buffer;
 *   prosodyData?: {
 *     pitchHz: number;
 *     energy: number;
 *     emotion: EmotionLevel;
 *     pitchVariance?: number;
 *   };
 *   detectedEmotion?: EmotionLevel;
 * }
 *
 * Returns:
 * {
 *   text: string;                    // Siani's response text
 *   emotion: EmotionLevel;            // Siani's emotional state
 *   emotionVector: number[];          // [calm, guarded, lit]
 *   tone: string;                     // "warm" | "gentle" | "energetic" | "supportive" | "empathetic"
 *   prosodyConfig: {
 *     pitch: number;                  // -20 to +20 semitones
 *     speakingRate: number;           // 0.25 to 4.0
 *     volumeGain: number;             // -96 to +16 dB
 *   };
 *   relationalContext: {
 *     trustLevel: number;             // 0-1
 *     familiarity: number;            // 0-1
 *     continuity: number;             // 0-1
 *   };
 *   contextualMemories: any[];        // Similar past conversations
 * }
 */
router.post("/interact", async (req: Request, res: Response) => {
  try {
    const { userId, transcript, audioData, prosodyData, detectedEmotion } =
      req.body;

    if (!userId || !transcript) {
      return res.status(400).json({
        error: "Missing required fields: userId, transcript",
      });
    }

    // Process through full intelligence pipeline
    const response = await sianiIntelligenceService.processVoiceInteraction({
      userId,
      transcript,
      audioData,
      prosodyData: prosodyData as ProsodyData | undefined,
      detectedEmotion,
    });

    res.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error("Error processing voice interaction:", error);
    res.status(500).json({
      error: "Failed to process voice interaction",
      details: error.message,
    });
  }
});

/**
 * GET /api/siani/context/:userId
 * Get current relational context for a user
 * (Useful for dashboard/UI to show trust/continuity metrics)
 */
router.get("/context/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { relationalMemoryService } = await import(
      "../services/relationalMemory.service"
    );
    const metrics = await relationalMemoryService.getRelationalMetrics(userId);

    if (!metrics) {
      return res.status(404).json({
        error: "No relational context found for user",
      });
    }

    res.json({
      success: true,
      context: metrics,
    });
  } catch (error: any) {
    console.error("Error retrieving context:", error);
    res.status(500).json({
      error: "Failed to retrieve context",
      details: error.message,
    });
  }
});

export default router;

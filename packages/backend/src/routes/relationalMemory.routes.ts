/**
 * Relational Memory API Routes
 *
 * Endpoints for storing and retrieving conversation memories with emotional context
 */

import { Router, Request, Response } from "express";
import { relationalMemoryService } from "../services/relationalMemory.service";

const router = Router();

/**
 * POST /api/memory/relational/store
 * Store a conversation memory with emotional context
 *
 * Body:
 * {
 *   userId: string;
 *   content: string;
 *   transcript: string;
 *   emotion: EmotionLevel;
 *   emotionVector: number[]; // [calm, guarded, lit]
 *   topics: string[];
 *   timestamp?: Date;
 * }
 */
router.post("/store", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      content,
      transcript,
      emotion,
      emotionVector,
      topics,
      prosodyData,
    } = req.body;

    if (!userId || !transcript || !emotion || !emotionVector) {
      return res.status(400).json({
        error:
          "Missing required fields: userId, transcript, emotion, emotionVector",
      });
    }

    await relationalMemoryService.storeConversation(
      userId,
      transcript,
      emotion,
      emotionVector,
      topics || [],
      prosodyData
    );

    res.status(201).json({
      success: true,
      message: "Conversation memory stored successfully",
    });
  } catch (error: any) {
    console.error("Error storing relational memory:", error);
    res.status(500).json({
      error: "Failed to store conversation memory",
      details: error.message,
    });
  }
});

/**
 * GET /api/memory/relational/context/:userId
 * Retrieve contextual memories for a user based on current conversation
 *
 * Query params:
 * - transcript: string (current conversation text)
 * - emotion: EmotionLevel (current emotional state)
 * - emotionVector: string (JSON array: [calm, guarded, lit])
 * - limit?: number (max memories to return, default 5)
 */
router.get("/context/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { transcript, emotion, emotionVector, limit } = req.query;

    if (!transcript || !emotion || !emotionVector) {
      return res.status(400).json({
        error:
          "Missing required query params: transcript, emotion, emotionVector",
      });
    }

    const parsedEmotionVector = JSON.parse(emotionVector as string);
    const contextLimit = limit ? parseInt(limit as string) : 5;

    const context = await relationalMemoryService.retrieveContext(
      userId,
      transcript as string,
      emotion as any,
      parsedEmotionVector,
      contextLimit
    );

    res.json({
      success: true,
      context,
    });
  } catch (error: any) {
    console.error("Error retrieving context:", error);
    res.status(500).json({
      error: "Failed to retrieve contextual memories",
      details: error.message,
    });
  }
});

/**
 * GET /api/memory/relational/metrics/:userId
 * Get relational metrics (Trust, Resonance, Continuity) for a user
 */
router.get("/metrics/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const metrics = await relationalMemoryService.getRelationalMetrics(userId);

    if (!metrics) {
      return res.status(404).json({
        error: "No relational context found for user",
      });
    }

    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error("Error retrieving metrics:", error);
    res.status(500).json({
      error: "Failed to retrieve relational metrics",
      details: error.message,
    });
  }
});

export default router;

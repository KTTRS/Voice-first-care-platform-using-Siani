import { Router } from "express";
import { ZodError, z } from "zod";
import {
  createMemoryMoment,
  deleteMemoryMoment,
  getMemoryMomentById,
  listMemoryMoments,
  updateMemoryMoment,
  searchMemoryMoments,
} from "../services/memoryMoment.service";
import {
  applyMemoryDecay,
  cleanupExpiredMemories,
  getMemoryLifecycleStats,
} from "../services/memoryLifecycle.service";
import { handlePrismaError } from "../utils/prismaError";
import { authenticate } from "../middleware/authenticate";
import { getPaginationParams } from "../utils/pagination";
import {
  createMemoryMomentSchema,
  updateMemoryMomentSchema,
} from "../validators/memoryMoment.validator";
import { logEvent } from "../utils/logger";
import { vectorDBService } from "../services/vectordb.service";
import { triggerSignalUpdate } from "../jobs/queues/signalQueue";
import { detectSDOH } from "../utils/sdohDetector";
import prisma from "../utils/db";

const router = Router();
router.use(authenticate);

// Search memory moments semantically
router.post("/search", async (req, res, next) => {
  try {
    const schema = z.object({
      query: z.string(),
      limit: z.number().min(1).max(50).default(10),
      prosody: z
        .object({
          pitchHz: z.number().min(0).max(500),
          energy: z.number().min(0).max(1),
          emotion: z.enum([
            "low",
            "neutral",
            "high",
            "detached",
            "anxious",
            "calm",
          ]),
          pitchVariance: z.number().optional(),
        })
        .optional(),
    });

    const { query, limit, prosody } = schema.parse(req.body);
    const userId = (req as any).user?.id;

    const results = await searchMemoryMoments(query, userId, limit, prosody);

    res.json({
      query,
      count: results.length,
      results,
      prosodyEnabled: !!prosody,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    next(error);
  }
});

// Get memory moments by emotion
router.get("/by-emotion/:emotion", async (req, res, next) => {
  try {
    const { emotion } = req.params;
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const results = await vectorDBService.getMemoryMomentsByEmotion(
      emotion,
      userId,
      limit
    );

    res.json({
      emotion,
      count: results.length,
      moments: results,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { take, skip } = getPaginationParams(
      req.query.limit,
      req.query.offset
    );
    const moments = await listMemoryMoments({ take, skip });
    res.json(moments);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "MemoryMoment id is required" });
    }

    const moment = await getMemoryMomentById(id);
    if (!moment) {
      return res.status(404).json({ error: "MemoryMoment not found" });
    }

    res.json(moment);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      content: z.string(),
      userId: z.string(),
      emotion: z.string(),
      tone: z.string(),
      vectorId: z.string().default("weaviate"), // Default to weaviate storage
      prosody: z
        .object({
          pitchHz: z.number().min(0).max(500),
          energy: z.number().min(0).max(1),
          emotion: z.enum([
            "low",
            "neutral",
            "high",
            "detached",
            "anxious",
            "calm",
          ]),
          pitchVariance: z.number().optional(),
        })
        .optional(),
    });

    const { prosody, ...payload } = schema.parse(req.body);

    const moment = await createMemoryMoment(payload, prosody);
    const actorId = (req as any).user?.id;
    logEvent("memoryMoment.created", { userId: actorId, data: moment });

    // Detect SDOH needs from memory moment content
    const sdohFlags = detectSDOH(moment.content);
    if (sdohFlags.length > 0) {
      // Create a signal event for SDOH detection tracking
      await prisma.signalEvent.create({
        data: {
          userId: payload.userId,
          type: "SDOH_DETECTED",
          delta: sdohFlags.length * 0.5, // Each detected need increases signal
        },
      });

      logEvent("sdoh.detected", {
        userId: payload.userId,
        needs: sdohFlags,
        source: "memory_moment",
        momentId: moment.id,
      });
    }

    // Trigger signal score update
    await triggerSignalUpdate(payload.userId, "memory_moment_created");

    res.status(201).json({
      ...moment,
      prosodyEnabled: !!prosody,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "MemoryMoment id is required" });
    }

    const payload = updateMemoryMomentSchema.parse(req.body);

    const updated = await updateMemoryMoment(id, payload);
    const actorId = (req as any).user?.id;
    logEvent("memoryMoment.updated", { userId: actorId, data: updated });
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    return handlePrismaError(error, res, next, "MemoryMoment not found");
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "MemoryMoment id is required" });
    }

    const removed = await deleteMemoryMoment(id);
    const actorId = (req as any).user?.id;
    logEvent("memoryMoment.deleted", { userId: actorId, data: removed });
    res.json(removed);
  } catch (error) {
    return handlePrismaError(error, res, next, "MemoryMoment not found");
  }
});

// Memory Lifecycle Management Endpoints

/**
 * GET /api/memory-moments/lifecycle/stats
 * Get memory lifecycle statistics
 */
router.get("/lifecycle/stats", async (req, res, next) => {
  try {
    const stats = await getMemoryLifecycleStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/memory-moments/lifecycle/decay
 * Apply memory decay to old memories
 */
router.post("/lifecycle/decay", async (req, res, next) => {
  try {
    const dryRun = req.body.dryRun !== false; // Default to dry run for safety
    const decayedCount = await applyMemoryDecay(dryRun);
    
    res.json({
      success: true,
      decayedCount,
      dryRun,
      message: dryRun
        ? `${decayedCount} memories would be decayed (dry run)`
        : `${decayedCount} memories were decayed`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/memory-moments/lifecycle/cleanup
 * Clean up expired memories
 */
router.post("/lifecycle/cleanup", async (req, res, next) => {
  try {
    const dryRun = req.body.dryRun !== false; // Default to dry run for safety
    const gracePeriodMultiplier = req.body.gracePeriodMultiplier || 2.0;
    
    const deletedCount = await cleanupExpiredMemories(
      gracePeriodMultiplier,
      dryRun
    );
    
    res.json({
      success: true,
      deletedCount,
      dryRun,
      gracePeriodMultiplier,
      message: dryRun
        ? `${deletedCount} memories would be deleted (dry run)`
        : `${deletedCount} memories were deleted`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

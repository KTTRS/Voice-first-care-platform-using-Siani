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
import { handlePrismaError } from "../utils/prismaError";
import { authenticate } from "../middleware/authenticate";
import { getPaginationParams } from "../utils/pagination";
import {
  createMemoryMomentSchema,
  updateMemoryMomentSchema,
} from "../validators/memoryMoment.validator";
import { logEvent } from "../utils/logger";
import { vectorDBService } from "../services/vectordb.service";

const router = Router();
router.use(authenticate);

// Search memory moments semantically
router.post("/search", async (req, res, next) => {
  try {
    const schema = z.object({
      query: z.string(),
      limit: z.number().min(1).max(50).default(10),
    });

    const { query, limit } = schema.parse(req.body);
    const userId = (req as any).user?.id;

    const results = await searchMemoryMoments(query, userId, limit);

    res.json({
      query,
      count: results.length,
      results,
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
    const payload = createMemoryMomentSchema.parse(req.body);

    const moment = await createMemoryMoment(payload);
    const actorId = (req as any).user?.id;
    logEvent("memoryMoment.created", { userId: actorId, data: moment });

    res.status(201).json(moment);
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

export default router;

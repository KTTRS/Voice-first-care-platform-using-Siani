import { Router } from "express";
import { ZodError } from "zod";
import {
  createDailyAction,
  deleteDailyAction,
  getDailyActionById,
  listDailyActions,
  updateDailyAction,
} from "../services/dailyAction.service";
import { handlePrismaError } from "../utils/prismaError";
import { authenticate } from "../utils/auth";
import { getPaginationParams } from "../utils/pagination";
import {
  createDailyActionSchema,
  updateDailyActionSchema,
} from "../validators/dailyAction.validator";
import { logEvent } from "../utils/logger";
import { trackDailyActionCompleted } from "../jobs/queues/feedQueue";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const { take, skip } = getPaginationParams(
      req.query.limit,
      req.query.offset
    );
    const actions = await listDailyActions({ take, skip });
    res.json(actions);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "DailyAction id is required" });
    }

    const action = await getDailyActionById(id);
    if (!action) {
      return res.status(404).json({ error: "DailyAction not found" });
    }

    res.json(action);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createDailyActionSchema.parse(req.body);

    const action = await createDailyAction(payload);
    const actorId = (req as any).user?.id;
    logEvent("dailyAction.created", { userId: actorId, data: action });

    res.status(201).json(action);
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
      return res.status(400).json({ error: "DailyAction id is required" });
    }

    const payload = updateDailyActionSchema.parse(req.body);

    const action = await updateDailyAction(id, payload);
    const actorId = (req as any).user?.id;
    logEvent("dailyAction.updated", { userId: actorId, data: action });

    // Track completion event if action was just completed
    if (payload.completed && action.completed) {
      await trackDailyActionCompleted({
        actionId: action.id,
        goalId: action.goalId || "",
        userId: action.userId,
        content: action.content,
        points: action.points,
      });
    }

    res.json(action);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    return handlePrismaError(error, res, next, "DailyAction not found");
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "DailyAction id is required" });
    }

    const removed = await deleteDailyAction(id);
    const actorId = (req as any).user?.id;
    logEvent("dailyAction.deleted", { userId: actorId, data: removed });
    res.json(removed);
  } catch (error) {
    return handlePrismaError(error, res, next, "DailyAction not found");
  }
});

export default router;

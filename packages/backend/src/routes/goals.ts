import { Router } from "express";
import { ZodError } from "zod";
import {
  createGoal,
  deleteGoal,
  getGoalById,
  listGoals,
  updateGoal,
} from "../services/goal.service";
import { handlePrismaError } from "../utils/prismaError";
import { authenticate } from "../middleware/authenticate";
import { getPaginationParams } from "../utils/pagination";
import {
  createGoalSchema,
  updateGoalSchema,
} from "../validators/goal.validator";
import { logEvent } from "../utils/logger";
import { taskQueue } from "../jobs/queues/taskQueue";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const { take, skip } = getPaginationParams(
      req.query.limit,
      req.query.offset
    );
    const goals = await listGoals({ take, skip });
    res.json(goals);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Goal id is required" });
    }

    const goal = await getGoalById(id);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(goal);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createGoalSchema.parse(req.body);

    const goal = await createGoal(payload);
    await taskQueue.add("sendWelcomePush", {
      userId: goal.userId,
      goalId: goal.id,
    });
    const actorId = (req as any).user?.id;
    logEvent("goal.created", { userId: actorId, data: goal });

    res.status(201).json(goal);
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
      return res.status(400).json({ error: "Goal id is required" });
    }

    const payload = updateGoalSchema.parse(req.body);

    const goal = await updateGoal(id, payload);
    const actorId = (req as any).user?.id;
    logEvent("goal.updated", { userId: actorId, data: goal });
    res.json(goal);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    return handlePrismaError(error, res, next, "Goal not found");
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Goal id is required" });
    }

    const goal = await deleteGoal(id);
    const actorId = (req as any).user?.id;
    logEvent("goal.deleted", { userId: actorId, data: goal });
    res.json(goal);
  } catch (error) {
    return handlePrismaError(error, res, next, "Goal not found");
  }
});

export default router;

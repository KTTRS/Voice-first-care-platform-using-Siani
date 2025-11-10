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
import { authenticate } from "../utils/auth";
import {
  createGoalSchema,
  updateGoalSchema,
  queryGoalsSchema,
} from "../validators/goal.validator";
import { logEvent } from "../utils/logger";
import { trackGoalCreated } from "../jobs/queues/feedQueue";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    // Validate query parameters
    const parseResult = queryGoalsSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.flatten() });
    }

    const {
      page = "1",
      pageSize = "10",
      userId,
      isActive,
      search,
    } = parseResult.data;

    // Parse pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 10;
    const skip = (pageNum - 1) * pageSizeNum;
    const take = Math.min(pageSizeNum, 100); // Max 100 items per page

    // Parse filter parameters
    const isActiveBool =
      isActive === "true" ? true : isActive === "false" ? false : undefined;

    // Call service with filters
    const result = await listGoals({
      skip,
      take,
      userId,
      isActive: isActiveBool,
      search,
    });

    res.json(result);
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

    // Track goal creation in feed
    await trackGoalCreated({
      goalId: goal.id,
      userId: goal.userId,
      title: goal.title,
      points: goal.points,
    }).catch((err) => console.error("Failed to track goal creation:", err));

    logEvent("goal.created", { data: goal });
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
    logEvent("goal.updated", { data: goal });
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
    logEvent("goal.deleted", { data: goal });
    res.json(goal);
  } catch (error) {
    return handlePrismaError(error, res, next, "Goal not found");
  }
});

export default router;

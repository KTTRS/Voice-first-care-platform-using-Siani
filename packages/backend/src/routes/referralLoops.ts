import { Router } from "express";
import { ZodError } from "zod";
import {
  createReferralLoop,
  deleteReferralLoop,
  getReferralLoopById,
  listReferralLoops,
  updateReferralLoop,
} from "../services/referralLoop.service";
import { handlePrismaError } from "../utils/prismaError";
import { authenticate } from "../middleware/authenticate";
import { getPaginationParams } from "../utils/pagination";
import {
  createReferralLoopSchema,
  updateReferralLoopSchema,
} from "../validators/referralLoop.validator";
import { logEvent } from "../utils/logger";
import { trackResourceUsed } from "../jobs/queues/feedQueue";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const { take, skip } = getPaginationParams(
      req.query.limit,
      req.query.offset
    );
    const loops = await listReferralLoops({ take, skip });
    res.json(loops);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ReferralLoop id is required" });
    }

    const loop = await getReferralLoopById(id);
    if (!loop) {
      return res.status(404).json({ error: "ReferralLoop not found" });
    }

    res.json(loop);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createReferralLoopSchema.parse(req.body);

    const loop = await createReferralLoop(payload);
    const actorId = (req as any).user?.id;
    logEvent("referralLoop.created", { userId: actorId, data: loop });

    // Track resource usage
    await trackResourceUsed({
      userId: loop.userId,
      resourceName: loop.resource,
      resourceId: loop.id,
    });

    res.status(201).json(loop);
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
      return res.status(400).json({ error: "ReferralLoop id is required" });
    }

    const payload = updateReferralLoopSchema.parse(req.body);

    const loop = await updateReferralLoop(id, payload);
    const actorId = (req as any).user?.id;
    logEvent("referralLoop.updated", { userId: actorId, data: loop });
    res.json(loop);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    return handlePrismaError(error, res, next, "ReferralLoop not found");
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ReferralLoop id is required" });
    }

    const loop = await deleteReferralLoop(id);
    const actorId = (req as any).user?.id;
    logEvent("referralLoop.deleted", { userId: actorId, data: loop });
    res.json(loop);
  } catch (error) {
    return handlePrismaError(error, res, next, "ReferralLoop not found");
  }
});

export default router;

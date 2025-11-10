import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";
import * as ResourceEngagementService from "../services/resourceEngagement.service";
import { runFollowUpCheckNow } from "../jobs/schedulers/resourceFollowUp";

const router = Router();

/**
 * GET /api/resource-engagements
 * Get resource engagements for the authenticated user or a specific user
 * Query params:
 * - userId: optional, filter by user ID
 * - status: optional, filter by status
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = (req.query.userId as string) || req.user?.id;
    const status = req.query.status as string | undefined;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const engagements =
      await ResourceEngagementService.getUserEngagementHistory(
        userId,
        status as any
      );

    res.json({ engagements });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resource-engagements/stats
 * Get engagement statistics for the authenticated user
 */
router.get(
  "/stats",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const stats = await ResourceEngagementService.getUserEngagementStats(
        userId
      );

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/resource-engagements/:id
 * Get a specific resource engagement by ID
 */
router.get(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const engagement = await ResourceEngagementService.getEngagementById(id);

      if (!engagement) {
        return res.status(404).json({ error: "Engagement not found" });
      }

      // Ensure user owns this engagement
      if (engagement.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(engagement);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/resource-engagements/:id
 * Update a resource engagement
 * Body can include:
 * - status: new status
 * - metadata: additional metadata
 */
router.patch(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { status, metadata } = req.body;

      const engagement = await ResourceEngagementService.getEngagementById(id);

      if (!engagement) {
        return res.status(404).json({ error: "Engagement not found" });
      }

      // Ensure user owns this engagement
      if (engagement.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await ResourceEngagementService.updateEngagementStatus(
        id,
        status,
        metadata
      );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/resource-engagements/:id/accept
 * Accept a resource offer
 */
router.post(
  "/:id/accept",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const engagement = await ResourceEngagementService.getEngagementById(id);

      if (!engagement) {
        return res.status(404).json({ error: "Engagement not found" });
      }

      if (engagement.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (engagement.status !== "OFFERED") {
        return res
          .status(400)
          .json({ error: "Can only accept offers with OFFERED status" });
      }

      const updated = await ResourceEngagementService.updateEngagementStatus(
        id,
        "ACCEPTED"
      );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/resource-engagements/:id/decline
 * Decline a resource offer
 * Body:
 * - reason: optional decline reason
 */
router.post(
  "/:id/decline",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      const engagement = await ResourceEngagementService.getEngagementById(id);

      if (!engagement) {
        return res.status(404).json({ error: "Engagement not found" });
      }

      if (engagement.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (engagement.status !== "OFFERED") {
        return res
          .status(400)
          .json({ error: "Can only decline offers with OFFERED status" });
      }

      const updated = await ResourceEngagementService.updateEngagementStatus(
        id,
        "DECLINED",
        reason ? { declineReason: reason } : undefined
      );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/resource-engagements/:id/complete
 * Mark a resource engagement as completed
 * Body:
 * - rating: optional 1-5 rating
 * - notes: optional completion notes
 */
router.post(
  "/:id/complete",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { rating, notes } = req.body;

      const engagement = await ResourceEngagementService.getEngagementById(id);

      if (!engagement) {
        return res.status(404).json({ error: "Engagement not found" });
      }

      if (engagement.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (engagement.status !== "ACCEPTED") {
        return res
          .status(400)
          .json({ error: "Can only complete accepted engagements" });
      }

      const metadata: any = {};
      if (rating) metadata.rating = rating;
      if (notes) metadata.completionNotes = notes;

      const updated = await ResourceEngagementService.updateEngagementStatus(
        id,
        "COMPLETED",
        metadata
      );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/resource-engagements/:id/fail
 * Mark a resource engagement as failed
 * Body:
 * - reason: failure reason
 */
router.post(
  "/:id/fail",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      const engagement = await ResourceEngagementService.getEngagementById(id);

      if (!engagement) {
        return res.status(404).json({ error: "Engagement not found" });
      }

      if (engagement.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (engagement.status !== "ACCEPTED") {
        return res
          .status(400)
          .json({ error: "Can only mark accepted engagements as failed" });
      }

      const metadata = { failureReason: reason };

      const updated = await ResourceEngagementService.updateEngagementStatus(
        id,
        "FAILED",
        metadata
      );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/resource-engagements/:id/escalate
 * Escalate a resource engagement that needs human intervention
 */
router.post(
  "/:id/escalate",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const engagement = await ResourceEngagementService.getEngagementById(id);

      if (!engagement) {
        return res.status(404).json({ error: "Engagement not found" });
      }

      if (engagement.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const escalated = await ResourceEngagementService.escalateEngagement(
        id,
        "User requested escalation"
      );

      res.json(escalated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/resource-engagements/admin/trigger-follow-ups
 * Manually trigger follow-up check (admin/testing only)
 */
router.post(
  "/admin/trigger-follow-ups",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await runFollowUpCheckNow();
      res.json({
        message: "Follow-up check completed",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import prisma from "../utils/db";
import { detectSDOH } from "../utils/sdohDetector";
import {
  analyzeUserSDOH,
  getActiveResourceEngagements,
  getCompletedResourceEngagements,
  getResourceEngagementStats,
  offerResource,
  acceptResource,
  declineResource,
  completeResource,
  failResource,
} from "../services/sdoh.service";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users/:id/sdoh-needs
 * Get detected SDOH needs for a user
 */
router.get("/:id/sdoh-needs", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    // Authorization: users can see their own, admin/doctor/nurse can see all
    if (
      userId !== currentUserId &&
      !["admin", "doctor", "nurse"].includes(userRole)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this user's SDOH data" });
    }

    const analysis = await analyzeUserSDOH(userId);

    res.json({
      userId,
      detectedNeeds: analysis.detectedNeeds,
      needCounts: analysis.needCounts,
      riskLevel: analysis.riskLevel,
      riskBadge:
        analysis.riskLevel >= 7
          ? "🔴 High"
          : analysis.riskLevel >= 4
          ? "🟠 Medium"
          : "🟢 Low",
    });
  } catch (error: any) {
    console.error("Error fetching SDOH needs:", error);
    res.status(500).json({ error: "Failed to fetch SDOH needs" });
  }
});

/**
 * GET /api/users/:id/resource-loops
 * Get all resource engagements for a user
 */
router.get("/:id/resource-loops", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    // Authorization
    if (
      userId !== currentUserId &&
      !["admin", "doctor", "nurse"].includes(userRole)
    ) {
      return res
        .status(403)
        .json({
          error: "Not authorized to view this user's resource engagements",
        });
    }

    const status = req.query.status as string | undefined;

    let engagements;
    if (status === "active") {
      engagements = await getActiveResourceEngagements(userId);
    } else if (status === "completed") {
      engagements = await getCompletedResourceEngagements(userId);
    } else {
      engagements = await prisma.resourceEngagement.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json(engagements);
  } catch (error: any) {
    console.error("Error fetching resource loops:", error);
    res.status(500).json({ error: "Failed to fetch resource engagements" });
  }
});

/**
 * GET /api/users/:id/resource-loops/stats
 * Get resource engagement statistics
 */
router.get("/:id/resource-loops/stats", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    // Authorization
    if (
      userId !== currentUserId &&
      !["admin", "doctor", "nurse"].includes(userRole)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this user's stats" });
    }

    const stats = await getResourceEngagementStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching resource stats:", error);
    res.status(500).json({ error: "Failed to fetch resource stats" });
  }
});

/**
 * POST /api/users/:id/resource-loops/offer
 * Offer a resource to address an SDOH need
 */
router.post("/:id/resource-loops/offer", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    // Only admin/doctor/nurse can offer resources
    if (!["admin", "doctor", "nurse"].includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Not authorized to offer resources" });
    }

    const { resourceName, resourceType, needType } = req.body;

    if (!resourceName || !resourceType || !needType) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: resourceName, resourceType, needType",
        });
    }

    const engagement = await offerResource({
      userId,
      resourceName,
      resourceType,
      needType,
      offeredBy: currentUserId,
    });

    res.status(201).json(engagement);
  } catch (error: any) {
    console.error("Error offering resource:", error);
    res.status(500).json({ error: "Failed to offer resource" });
  }
});

/**
 * POST /api/users/:id/resource-loops/:engagementId/accept
 * User accepts a resource offer
 */
router.post("/:id/resource-loops/:engagementId/accept", async (req, res) => {
  try {
    const userId = req.params.id;
    const engagementId = req.params.engagementId;
    const currentUserId = (req as any).user?.userId;

    // Only the user can accept their own resources
    if (userId !== currentUserId) {
      return res
        .status(403)
        .json({ error: "Not authorized to accept this resource" });
    }

    const engagement = await acceptResource(engagementId);
    res.json(engagement);
  } catch (error: any) {
    console.error("Error accepting resource:", error);
    res.status(500).json({ error: "Failed to accept resource" });
  }
});

/**
 * POST /api/users/:id/resource-loops/:engagementId/decline
 * User declines a resource offer
 */
router.post("/:id/resource-loops/:engagementId/decline", async (req, res) => {
  try {
    const userId = req.params.id;
    const engagementId = req.params.engagementId;
    const currentUserId = (req as any).user?.userId;

    // Only the user can decline their own resources
    if (userId !== currentUserId) {
      return res
        .status(403)
        .json({ error: "Not authorized to decline this resource" });
    }

    const { reason } = req.body;
    const engagement = await declineResource(engagementId, reason);
    res.json(engagement);
  } catch (error: any) {
    console.error("Error declining resource:", error);
    res.status(500).json({ error: "Failed to decline resource" });
  }
});

/**
 * POST /api/users/:id/resource-loops/:engagementId/complete
 * Mark resource engagement as completed (successful)
 */
router.post("/:id/resource-loops/:engagementId/complete", async (req, res) => {
  try {
    const userId = req.params.id;
    const engagementId = req.params.engagementId;
    const userRole = (req as any).user?.role;

    // Admin/doctor/nurse can mark complete
    if (!["admin", "doctor", "nurse"].includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Not authorized to complete resources" });
    }

    const { successRating, impactNotes } = req.body;

    const engagement = await completeResource({
      engagementId,
      successRating,
      impactNotes,
    });

    res.json(engagement);
  } catch (error: any) {
    console.error("Error completing resource:", error);
    res.status(500).json({ error: "Failed to complete resource" });
  }
});

/**
 * POST /api/users/:id/resource-loops/:engagementId/fail
 * Mark resource engagement as failed
 */
router.post("/:id/resource-loops/:engagementId/fail", async (req, res) => {
  try {
    const userId = req.params.id;
    const engagementId = req.params.engagementId;
    const userRole = (req as any).user?.role;

    // Admin/doctor/nurse can mark failed
    if (!["admin", "doctor", "nurse"].includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Not authorized to fail resources" });
    }

    const { notes } = req.body;
    const engagement = await failResource(engagementId, notes);
    res.json(engagement);
  } catch (error: any) {
    console.error("Error failing resource:", error);
    res.status(500).json({ error: "Failed to mark resource as failed" });
  }
});

/**
 * GET /api/users/:id/signal-snapshot
 * Get comprehensive signal + SDOH snapshot
 */
router.get("/:id/signal-snapshot", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    // Authorization
    if (
      userId !== currentUserId &&
      !["admin", "doctor", "nurse"].includes(userRole)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this user's snapshot" });
    }

    // Fetch signal score and SDOH data in parallel
    const [signalScore, sdohAnalysis, resourceStats] = await Promise.all([
      prisma.signalScore.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      analyzeUserSDOH(userId),
      getResourceEngagementStats(userId),
    ]);

    res.json({
      userId,
      signalScore: signalScore || null,
      sdoh: {
        detectedNeeds: sdohAnalysis.detectedNeeds,
        needCounts: sdohAnalysis.needCounts,
        riskLevel: sdohAnalysis.riskLevel,
      },
      resources: resourceStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching signal snapshot:", error);
    res.status(500).json({ error: "Failed to fetch signal snapshot" });
  }
});

export default router;

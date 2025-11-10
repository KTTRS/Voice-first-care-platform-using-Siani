import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { streakService } from "../services/streak.service";
import { triggerStreakCheckNow } from "../jobs/schedulers/dailyStreakCheck";
import prisma from "../utils/db";

const router = Router();
router.use(authenticate);

/**
 * GET /api/streaks/stats/:userId
 * Get streak statistics for a specific user
 */
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await streakService.getUserStreakStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching streak stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch streak statistics",
    });
  }
});

/**
 * GET /api/streaks/leaderboard
 * Get top users by current streak
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get all users with actions
    const usersWithActions = await prisma.user.findMany({
      where: {
        dailyActions: {
          some: {
            completed: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Calculate streaks for each user
    const leaderboard = [];

    for (const user of usersWithActions) {
      const streak = await streakService.calculateUserStreak(user.id);

      if (streak.currentStreak > 0) {
        leaderboard.push({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          isActive: streak.isActive,
        });
      }
    }

    // Sort by current streak descending
    leaderboard.sort((a, b) => b.currentStreak - a.currentStreak);

    res.json({
      success: true,
      data: leaderboard.slice(0, limit),
      meta: {
        total: leaderboard.length,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard",
    });
  }
});

/**
 * POST /api/streaks/check
 * Manually trigger streak check for all users (admin only)
 */
router.post("/check", async (req, res) => {
  try {
    const userRole = (req as any).user?.role;

    // In production, restrict to admin users
    if (process.env.NODE_ENV === "production" && userRole !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    // Trigger streak check asynchronously
    triggerStreakCheckNow().catch((err) => {
      console.error("Streak check error:", err);
    });

    res.json({
      success: true,
      message: "Streak check triggered",
    });
  } catch (error) {
    console.error("Error triggering streak check:", error);
    res.status(500).json({
      success: false,
      error: "Failed to trigger streak check",
    });
  }
});

/**
 * GET /api/streaks/my-stats
 * Get streak statistics for the authenticated user
 */
router.get("/my-stats", async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const stats = await streakService.getUserStreakStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching my streak stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch streak statistics",
    });
  }
});

export default router;

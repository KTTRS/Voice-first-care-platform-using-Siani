import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { feedService } from "../services/feed.service";
import { getFeedEvents } from "../services/feedEvent.service";
import prisma from "../utils/db";

const router = Router();
router.use(authenticate);

// Get user's personal feed
router.get("/me", async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.user?.id || "6916d6e8-a69d-4501-b703-d278c6d62947"; // Fallback for testing

    const feed = await feedService.getUserFeed(userId, limit);

    res.json({
      count: feed.length,
      feed,
    });
  } catch (error) {
    console.error("Error fetching user feed:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});

// Get community feed (all users)
router.get("/community", async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const feed = await feedService.getCommunityFeed(limit);

    res.json({
      count: feed.length,
      feed,
    });
  } catch (error) {
    console.error("Error fetching community feed:", error);
    res.status(500).json({ error: "Failed to fetch community feed" });
  }
});

// Get user milestones/stats
router.get("/milestones", async (req: any, res) => {
  try {
    const userId = req.user?.id || "6916d6e8-a69d-4501-b703-d278c6d62947"; // Fallback for testing

    const milestones = await feedService.getGoalMilestones(userId);

    res.json({
      milestones,
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});

// Get structured feed events with pagination
router.get("/", async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const userId = req.query.userId as string | undefined;

    const result = await getFeedEvents({ page, pageSize, userId });

    res.json({
      data: result.events,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching feed events:", error);
    res.status(500).json({ error: "Failed to fetch feed events" });
  }
});

export default router;

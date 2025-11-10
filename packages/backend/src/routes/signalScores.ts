import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import prisma from "../utils/db";
import {
  analyzeUserSignals,
  getLatestSignalScore,
  getSignalScoreHistory,
  getRiskBadge,
  processUserSignal,
} from "../services/signalEngine.service";
import {
  triggerSignalUpdate,
  triggerBulkSignalUpdate,
} from "../jobs/queues/signalQueue";

const router = Router();
router.use(authenticate);

/**
 * GET /api/signals/:userId
 * Get latest signal score for a user
 */
router.get("/:userId", async (req: any, res) => {
  try {
    const { userId } = req.params;

    // Check authorization - users can only see their own scores unless admin/provider
    if (
      req.user.id !== userId &&
      !["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const score = await getLatestSignalScore(userId);

    if (!score) {
      return res.status(404).json({ error: "No signal score found" });
    }

    const badge = getRiskBadge(score.overallRisk);

    res.json({
      ...score,
      badge,
    });
  } catch (error) {
    console.error("Error fetching signal score:", error);
    res.status(500).json({ error: "Failed to fetch signal score" });
  }
});

/**
 * GET /api/signals/:userId/history
 * Get signal score history for trend analysis
 */
router.get("/:userId/history", async (req: any, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;

    // Check authorization
    if (
      req.user.id !== userId &&
      !["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const history = await getSignalScoreHistory(userId, limit);

    res.json({
      userId,
      count: history.length,
      scores: history,
    });
  } catch (error) {
    console.error("Error fetching signal score history:", error);
    res.status(500).json({ error: "Failed to fetch signal score history" });
  }
});

/**
 * POST /api/signals/:userId/analyze
 * Trigger real-time signal analysis for a user
 */
router.post("/:userId/analyze", async (req: any, res) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (
      req.user.id !== userId &&
      !["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Run analysis
    await processUserSignal(userId);

    // Get the newly created score
    const score = await getLatestSignalScore(userId);
    const badge = getRiskBadge(score!.overallRisk);

    res.json({
      message: "Signal analysis completed",
      score: {
        ...score,
        badge,
      },
    });
  } catch (error) {
    console.error("Error analyzing signals:", error);
    res.status(500).json({ error: "Failed to analyze signals" });
  }
});

/**
 * GET /api/signals/:userId/live
 * Get real-time signal analysis without saving to database
 */
router.get("/:userId/live", async (req: any, res) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (
      req.user.id !== userId &&
      !["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const analysis = await analyzeUserSignals(userId);
    const badge = getRiskBadge(analysis.overallRisk);

    res.json({
      ...analysis,
      badge,
    });
  } catch (error) {
    console.error("Error analyzing signals:", error);
    res.status(500).json({ error: "Failed to analyze signals" });
  }
});

/**
 * GET /api/signals/high-risk
 * Get all users with high risk scores (admin/provider only)
 */
router.get("/high-risk/list", async (req: any, res) => {
  try {
    // Only admin/providers can see this
    if (!["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const threshold = parseFloat(req.query.threshold as string) || 7.0;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get most recent scores for each user with high risk
    const highRiskScores = await prisma.signalScore.findMany({
      where: {
        overallRisk: {
          gte: threshold,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        overallRisk: "desc",
      },
      take: limit,
    });

    res.json({
      threshold,
      count: highRiskScores.length,
      patients: highRiskScores.map((score) => ({
        ...score,
        badge: getRiskBadge(score.overallRisk),
      })),
    });
  } catch (error) {
    console.error("Error fetching high-risk patients:", error);
    res.status(500).json({ error: "Failed to fetch high-risk patients" });
  }
});

/**
 * GET /api/signals/trending/:userId
 * Get trending analysis for a patient's scores
 */
router.get("/trending/:userId", async (req: any, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    // Check authorization
    if (
      req.user.id !== userId &&
      !["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const history = await getSignalScoreHistory(userId, days);

    if (history.length < 2) {
      return res.json({
        userId,
        message: "Insufficient data for trend analysis",
        dataPoints: history.length,
      });
    }

    // Calculate trends for each category
    const calculateTrend = (field: keyof (typeof history)[0]) => {
      const values = history
        .map((h) => h[field] as number)
        .filter((v) => v !== null);
      if (values.length < 2) return null;

      const recent = values.slice(0, Math.ceil(values.length / 2));
      const older = values.slice(Math.ceil(values.length / 2));

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      const change = recentAvg - olderAvg;
      const percentChange = olderAvg !== 0 ? (change / olderAvg) * 100 : 0;

      return {
        current: recentAvg,
        previous: olderAvg,
        change,
        percentChange: parseFloat(percentChange.toFixed(2)),
        direction:
          change > 0.5 ? "increasing" : change < -0.5 ? "decreasing" : "stable",
      };
    };

    res.json({
      userId,
      period: `${days} days`,
      dataPoints: history.length,
      trends: {
        overallRisk: calculateTrend("overallRisk"),
        medicationAdherence: calculateTrend("medicationAdherence"),
        mentalHealthRisk: calculateTrend("mentalHealthRisk"),
        socialIsolation: calculateTrend("socialIsolation"),
        careCoordination: calculateTrend("careCoordination"),
        systemTrust: calculateTrend("systemTrust"),
      },
    });
  } catch (error) {
    console.error("Error calculating trends:", error);
    res.status(500).json({ error: "Failed to calculate trends" });
  }
});

/**
 * GET /api/signals/cohort/analysis
 * Cohort-level analytics (admin/provider only)
 */
router.get("/cohort/analysis", async (req: any, res) => {
  try {
    if (!["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const days = parseInt(req.query.days as string) || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all recent scores
    const recentScores = await prisma.signalScore.findMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
      },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    // Calculate cohort statistics
    const stats = {
      totalPatients: new Set(recentScores.map((s) => s.userId)).size,
      averageScores: {
        overallRisk: 0,
        medicationAdherence: 0,
        mentalHealthRisk: 0,
        socialIsolation: 0,
        careCoordination: 0,
        systemTrust: 0,
      },
      riskDistribution: {
        critical: 0, // 7-10
        watch: 0, // 4-6.9
        stable: 0, // 0-3.9
      },
      categoryAlerts: {
        highMedicationRisk: 0,
        highMentalHealthRisk: 0,
        highSocialIsolation: 0,
        poorCareCoordination: 0,
        lowSystemTrust: 0,
      },
    };

    if (recentScores.length === 0) {
      return res.json({
        period: `${days} days`,
        message: "No data available",
        stats,
      });
    }

    // Calculate averages
    const fields: Array<keyof typeof stats.averageScores> = [
      "overallRisk",
      "medicationAdherence",
      "mentalHealthRisk",
      "socialIsolation",
      "careCoordination",
      "systemTrust",
    ];

    fields.forEach((field) => {
      const sum = recentScores.reduce(
        (acc, score) => acc + (score[field] || 0),
        0
      );
      stats.averageScores[field] = parseFloat(
        (sum / recentScores.length).toFixed(2)
      );
    });

    // Calculate risk distribution
    recentScores.forEach((score) => {
      const risk = score.overallRisk;
      if (risk >= 7) stats.riskDistribution.critical++;
      else if (risk >= 4) stats.riskDistribution.watch++;
      else stats.riskDistribution.stable++;

      // Category alerts (threshold: 7+)
      if (score.medicationAdherence >= 7)
        stats.categoryAlerts.highMedicationRisk++;
      if (score.mentalHealthRisk >= 7)
        stats.categoryAlerts.highMentalHealthRisk++;
      if (score.socialIsolation >= 7)
        stats.categoryAlerts.highSocialIsolation++;
      if (score.careCoordination >= 7)
        stats.categoryAlerts.poorCareCoordination++;
      if (score.systemTrust >= 7) stats.categoryAlerts.lowSystemTrust++;
    });

    res.json({
      period: `${days} days`,
      stats,
    });
  } catch (error) {
    console.error("Error fetching cohort analysis:", error);
    res.status(500).json({ error: "Failed to fetch cohort analysis" });
  }
});

/**
 * POST /api/signals/alerts/:userId
 * Create alert thresholds for a patient (admin/provider only)
 */
router.post("/alerts/:userId", async (req: any, res) => {
  try {
    if (!["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { userId } = req.params;
    const { thresholds, notifyProvider } = req.body;

    // Get latest score
    const latestScore = await getLatestSignalScore(userId);

    if (!latestScore) {
      return res.status(404).json({ error: "No scores found for patient" });
    }

    // Check if any threshold is exceeded
    interface Alert {
      category: string;
      current: number;
      threshold: number;
      exceeded: boolean;
    }

    const alerts: Alert[] = [];
    const checkThreshold = (field: keyof typeof latestScore, name: string) => {
      if (
        thresholds[field] &&
        (latestScore[field] as number) >= thresholds[field]
      ) {
        alerts.push({
          category: name,
          current: latestScore[field] as number,
          threshold: thresholds[field],
          exceeded: true,
        });
      }
    };

    checkThreshold("overallRisk", "Overall Risk");
    checkThreshold("medicationAdherence", "Medication Adherence");
    checkThreshold("mentalHealthRisk", "Mental Health Risk");
    checkThreshold("socialIsolation", "Social Isolation");
    checkThreshold("careCoordination", "Care Coordination");
    checkThreshold("systemTrust", "System Trust");

    res.json({
      userId,
      currentScore: latestScore,
      thresholds,
      alerts,
      alertCount: alerts.length,
      notifyProvider: notifyProvider && alerts.length > 0,
    });
  } catch (error) {
    console.error("Error checking alerts:", error);
    res.status(500).json({ error: "Failed to check alerts" });
  }
});

/**
 * POST /api/signals/batch/analyze
 * Trigger batch analysis for multiple patients (admin only)
 */
router.post("/batch/analyze", async (req: any, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden - Admin only" });
    }

    const { userIds, reason } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: "userIds array required" });
    }

    // Queue bulk signal updates
    await triggerBulkSignalUpdate(userIds, reason || "manual_batch_analysis");

    res.json({
      message: "Batch analysis queued",
      count: userIds.length,
      reason: reason || "manual_batch_analysis",
    });
  } catch (error) {
    console.error("Error queueing batch analysis:", error);
    res.status(500).json({ error: "Failed to queue batch analysis" });
  }
});

export { router as signalRouter };

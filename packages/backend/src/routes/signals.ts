import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../utils/db";
import { authenticate } from "../utils/auth";
import { signalScoringEngine } from "../services/scoring.service";

const router = Router();

const createSignalSchema = z.object({
  type: z.enum(["VITAL_SIGN", "SYMPTOM", "MEDICATION", "MOOD", "ACTIVITY"]),
  value: z.string(),
  patientId: z.string().uuid(),
  metadata: z.any().optional(),
});

// Get signals for a patient
router.get(
  "/patient/:patientId",
  authenticate,
  async (req: any, res: Response) => {
    try {
      const { patientId } = req.params;
      const { limit = "50", severity } = req.query;

      const where: any = { patientId };
      if (severity) {
        where.severity = severity;
      }

      const signals = await prisma.signal.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: parseInt(limit as string),
        include: {
          patient: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  }
);

// Get high-priority signals
router.get("/high-priority", authenticate, async (req: any, res: Response) => {
  try {
    const signals = await prisma.signal.findMany({
      where: {
        severity: {
          in: ["HIGH", "CRITICAL"],
        },
      },
      orderBy: [{ severity: "desc" }, { score: "desc" }, { timestamp: "desc" }],
      take: 100,
      include: {
        patient: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch high-priority signals" });
  }
});

// Create a new signal
router.post("/", authenticate, async (req: any, res: Response) => {
  try {
    const data = createSignalSchema.parse(req.body);

    // Determine severity using scoring engine
    const severity = signalScoringEngine.determineSeverity({
      type: data.type,
      value: data.value,
      metadata: data.metadata,
    });

    // Calculate score
    const score = signalScoringEngine.calculateScore(
      {
        type: data.type,
        value: data.value,
        metadata: data.metadata,
      },
      severity
    );

    const signal = await prisma.signal.create({
      data: {
        type: data.type,
        value: data.value,
        severity,
        score,
        metadata: data.metadata,
        patientId: data.patientId,
        recordedById: req.user!.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      signal,
      interpretation: signalScoringEngine.getScoreInterpretation(score),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create signal" });
  }
});

// Get signal analytics for a patient
router.get(
  "/analytics/:patientId",
  authenticate,
  async (req: any, res: Response) => {
    try {
      const { patientId } = req.params;

      const signals = await prisma.signal.findMany({
        where: { patientId },
        orderBy: { timestamp: "desc" },
      });

      const analytics = {
        total: signals.length,
        bySeverity: {
          CRITICAL: signals.filter((s) => s.severity === "CRITICAL").length,
          HIGH: signals.filter((s) => s.severity === "HIGH").length,
          MEDIUM: signals.filter((s) => s.severity === "MEDIUM").length,
          LOW: signals.filter((s) => s.severity === "LOW").length,
        },
        byType: {
          VITAL_SIGN: signals.filter((s) => s.type === "VITAL_SIGN").length,
          SYMPTOM: signals.filter((s) => s.type === "SYMPTOM").length,
          MEDICATION: signals.filter((s) => s.type === "MEDICATION").length,
          MOOD: signals.filter((s) => s.type === "MOOD").length,
          ACTIVITY: signals.filter((s) => s.type === "ACTIVITY").length,
        },
        averageScore:
          signals.length > 0
            ? signals.reduce((sum, s) => sum + s.score, 0) / signals.length
            : 0,
        recentHighPriority: signals
          .filter((s) => ["HIGH", "CRITICAL"].includes(s.severity))
          .slice(0, 10),
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  }
);

export { router as signalRouter };

import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/authenticate";
import { detectSDOH } from "../utils/sdohDetector";
import prisma from "../utils/db";
import { triggerSignalUpdate } from "../jobs/queues/signalQueue";
import {
  analyzeEmotion,
  detectIntent,
  generateSianiResponse,
  needsImmediateIntervention,
  calculateEmotionIntensity,
  analyzeEngagement,
} from "../utils/emotionAnalysis";

const router = Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/audio");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /m4a|mp3|wav|webm|ogg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid audio file type"));
    }
  },
});

/**
 * POST /api/voice/analyze
 * Upload audio, transcribe, analyze for SDOH + emotion
 *
 * Request:
 * - multipart/form-data with 'audio' file
 * - userId in body or from JWT
 *
 * Response:
 * {
 *   transcription: string,
 *   emotion: string,
 *   sdohFlags: string[],
 *   memoryMomentId: string
 * }
 */
router.post(
  "/analyze",
  authenticate,
  upload.single("audio"),
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userId || req.body.userId;

      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Audio file required" });
      }

      console.log(`[Voice] Analyzing audio for user ${userId}`);
      console.log(`[Voice] File: ${req.file.filename}`);

      // TODO: Implement actual transcription
      // Options:
      // 1. OpenAI Whisper API
      // 2. Deepgram API
      // 3. Google Speech-to-Text
      // 4. Local Whisper model

      // For now, simulate transcription
      const transcription = await simulateTranscription(req.file.path);

      // Enhanced emotion and intent analysis
      const emotionLevel = analyzeEmotion(transcription);
      const intent = detectIntent(transcription);
      const sianiResponse = generateSianiResponse(
        emotionLevel,
        intent,
        transcription
      );
      const intensity = calculateEmotionIntensity(transcription, emotionLevel);
      const engagement = analyzeEngagement(transcription);
      const needsIntervention = needsImmediateIntervention(transcription);

      // Detect SDOH needs
      const sdohFlags = detectSDOH(transcription);

      // Create MemoryMoment with detected signals
      const memoryMoment = await prisma.memoryMoment.create({
        data: {
          userId,
          content: transcription,
          emotion: emotionLevel,
          tone: emotionLevel, // Use emotion as tone for now
          vectorId: "", // Empty for now, can be populated later with embeddings
          source: "voice",
          metadata: {
            audioFile: req.file.filename,
            sdohFlags,
            intent,
            intensity,
            engagement,
            needsIntervention,
            sianiResponse,
            analyzedAt: new Date().toISOString(),
          },
        },
      });

      // Trigger signal score update
      await triggerSignalUpdate(userId, "voice_analysis_completed");

      // Log important detections
      if (sdohFlags.length > 0) {
        console.log(`[Voice] SDOH flags detected: ${sdohFlags.join(", ")}`);
      }
      if (needsIntervention) {
        console.log(
          `[Voice] ⚠️  CRISIS INTERVENTION NEEDED for user ${userId}`
        );
      }

      res.json({
        transcription,
        emotion: emotionLevel,
        intent,
        intensity,
        engagement,
        sianiResponse,
        sdohFlags,
        needsIntervention,
        memoryMomentId: memoryMoment.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[Voice] Analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/voice/recordings/:userId
 * Get voice recording history for a user
 */
router.get(
  "/recordings/:userId",
  authenticate,
  async (req: any, res: Response) => {
    try {
      const { userId } = req.params;

      // Authorization: users can only access their own recordings
      if (req.user?.userId !== userId && req.user?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const recordings = await prisma.memoryMoment.findMany({
        where: {
          userId,
          source: "voice",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          content: true,
          emotion: true,
          createdAt: true,
          metadata: true,
        },
      });

      res.json({ recordings });
    } catch (error: any) {
      console.error("[Voice] Failed to fetch recordings:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Simulate transcription (placeholder for actual Whisper/Deepgram integration)
 */
async function simulateTranscription(audioPath: string): Promise<string> {
  // TODO: Replace with actual transcription service
  // Example with OpenAI Whisper:
  // const file = fs.createReadStream(audioPath);
  // const response = await openai.audio.transcriptions.create({
  //   file,
  //   model: "whisper-1",
  // });
  // return response.text;

  return "Simulated transcription: I'm feeling stressed about rent this month and don't have a ride to my appointment.";
}

export default router;

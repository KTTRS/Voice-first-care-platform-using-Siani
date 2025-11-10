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
import {
  transcribeAudio,
  transcribeWithEmotionContext,
  deleteAudioFile,
  estimateTranscriptionCost,
  checkTranscriptionHealth,
} from "../services/transcription.service";
import { analyzeAudioFile } from "../services/prosody.service";
import { createMemoryMoment } from "../services/memoryMoment.service";
import { EmotionLevel } from "../utils/emotionAnalysis";

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

      // Transcribe audio using configured strategy (OpenAI/Local/Hybrid)
      const transcriptionResult = await transcribeAudio(req.file.path);
      const transcription = transcriptionResult.text;

      console.log(
        `[Voice] Transcription completed via ${transcriptionResult.source}`
      );
      console.log(`[Voice] Text: ${transcription.substring(0, 100)}...`);

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

      // Estimate transcription cost for tracking
      const cost = transcriptionResult.duration
        ? estimateTranscriptionCost(transcriptionResult.duration)
        : null;

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
            transcription: {
              source: transcriptionResult.source,
              language: transcriptionResult.language,
              duration: transcriptionResult.duration,
              cost: cost?.cost,
              timestamp: transcriptionResult.timestamp,
            },
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

      // Delete audio file for privacy (optional - controlled by env var)
      if (process.env.DELETE_AUDIO_AFTER_TRANSCRIPTION === "true") {
        await deleteAudioFile(req.file.path);
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
        transcriptionSource: transcriptionResult.source,
        language: transcriptionResult.language,
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
 * POST /api/voice/transcribe
 * Dedicated endpoint for transcription with integrated prosody analysis
 * and automatic memory moment creation
 * 
 * Enhanced to:
 * 1. Transcribe audio (Whisper)
 * 2. Analyze prosody (pitch, energy, emotion)
 * 3. Create memory moment with combined text+prosody embeddings
 */
router.post(
  "/transcribe",
  authenticate,
  upload.single("audio"),
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Audio file required" });
      }

      const userId = req.user?.userId || req.body.userId;
      const createMemory = req.body.createMemory !== "false"; // Default to true

      console.log(`[Voice] Transcribing audio: ${req.file.filename}`);

      // Parallel processing: transcription + prosody analysis
      const [transcriptionResult, prosodyData] = await Promise.all([
        transcribeAudio(req.file.path),
        analyzeAudioFile(req.file.path),
      ]);

      const transcription = transcriptionResult.text;

      console.log(
        `[Voice] Transcription completed via ${transcriptionResult.source}`
      );
      console.log(`[Voice] Prosody: pitch=${prosodyData.pitchHz.toFixed(1)}Hz, energy=${prosodyData.energy.toFixed(2)}`);

      // Analyze emotion from text
      const emotionLevel = analyzeEmotion(transcription);

      // Map emotion level to prosody emotion format
      const prosodyEmotion: EmotionLevel = emotionLevel as EmotionLevel;

      // Prepare combined prosody data for memory embedding
      const prosodyForMemory = {
        pitchHz: prosodyData.pitchHz,
        energy: prosodyData.energy,
        emotion: prosodyEmotion,
        pitchVariance: prosodyData.pitchVariance,
      };

      // Create memory moment with prosody-enhanced embedding if requested
      let memoryMoment = null;
      if (createMemory && userId) {
        try {
          memoryMoment = await createMemoryMoment(
            {
              userId,
              content: transcription,
              emotion: emotionLevel,
              tone: emotionLevel,
              vectorId: "weaviate",
              source: "voice_transcribe",
            },
            prosodyForMemory
          );

          console.log(
            `[Voice] ✅ Memory moment created with prosody embedding: ${memoryMoment.id}`
          );
        } catch (memoryError: any) {
          console.error("[Voice] Failed to create memory moment:", memoryError);
          // Continue even if memory creation fails
        }
      }

      // Delete audio file after processing if configured
      if (process.env.DELETE_AUDIO_AFTER_TRANSCRIPTION === "true") {
        await deleteAudioFile(req.file.path);
      }

      res.json({
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
        source: transcriptionResult.source,
        timestamp: transcriptionResult.timestamp,
        prosody: {
          pitchHz: prosodyData.pitchHz,
          energy: prosodyData.energy,
          emotion: prosodyEmotion,
          pitchVariance: prosodyData.pitchVariance,
        },
        emotion: emotionLevel,
        memoryMomentId: memoryMoment?.id,
        prosodyEnabled: true,
      });
    } catch (error: any) {
      console.error("[Voice] Transcription error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/voice/health
 * Check transcription service health
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const health = await checkTranscriptionHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      healthy: false,
      error: error.message,
    });
  }
});

export default router;

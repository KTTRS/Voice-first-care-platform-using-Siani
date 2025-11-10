import { Router } from "express";
import { z } from "zod";
import { emotionClassifierService } from "../services/emotionClassifier.service";

const router = Router();

/**
 * POST /api/emotion/classify
 * Classify emotion from voice and text features
 */
router.post("/classify", async (req, res, next) => {
  try {
    const schema = z.object({
      transcript: z.string(),
      features: z
        .object({
          pitch_contour: z.array(z.number()).optional(),
          energy_curve: z.array(z.number()).optional(),
          speech_rate: z.number().optional(),
          pause_durations: z.array(z.number()).optional(),
          prosody_summary: z.string().optional(),
          lexical_tone_indicators: z.array(z.string()).optional(),
        })
        .optional(),
    });

    const { transcript, features } = schema.parse(req.body);

    const classification = await emotionClassifierService.classifyEmotion({
      transcript,
      ...features,
    });

    res.json(classification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    next(error);
  }
});

/**
 * POST /api/emotion/classify/batch
 * Classify emotions for multiple utterances
 */
router.post("/classify/batch", async (req, res, next) => {
  try {
    const schema = z.object({
      items: z.array(
        z.object({
          transcript: z.string(),
          features: z
            .object({
              pitch_contour: z.array(z.number()).optional(),
              energy_curve: z.array(z.number()).optional(),
              speech_rate: z.number().optional(),
              pause_durations: z.array(z.number()).optional(),
              prosody_summary: z.string().optional(),
              lexical_tone_indicators: z.array(z.string()).optional(),
            })
            .optional(),
        })
      ),
    });

    const { items } = schema.parse(req.body);

    const featuresArray = items.map((item) => ({
      transcript: item.transcript,
      ...item.features,
    }));

    const classifications = await emotionClassifierService.classifyBatch(
      featuresArray
    );

    res.json({ count: classifications.length, results: classifications });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    next(error);
  }
});

export default router;

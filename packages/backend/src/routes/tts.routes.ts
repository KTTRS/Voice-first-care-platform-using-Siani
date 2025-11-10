import { Router, Request, Response } from "express";
import { Server } from "http";
import { analyzeProsody } from "../services/prosody.service";
import { broadcastProsody } from "./prosody.routes";
import { WebSocketServer } from "ws";

const router = Router();

// TTS client (optional - Google Cloud TTS)
let ttsClient: any | null = null;
let prosodyWss: WebSocketServer | null = null;

// Try to import Google Cloud TTS (optional dependency)
let speech: any = null;
try {
  speech = require("@google-cloud/text-to-speech");
} catch (error) {
  console.log("[TTS] Google Cloud TTS not installed (optional)");
}

/**
 * Initialize TTS service with prosody broadcasting
 */
export function initTTSService(wss: WebSocketServer) {
  prosodyWss = wss;

  if (speech) {
    try {
      ttsClient = new speech.TextToSpeechClient();
      console.log("[TTS] Service initialized with Google Cloud TTS");
    } catch (error) {
      console.warn(
        "[TTS] Google Cloud TTS configuration error, using fallback"
      );
    }
  } else {
    console.log("[TTS] Using fallback mode (client-side TTS)");
  }
}

/**
 * POST /api/tts/synthesize
 * Generate speech with real-time prosody streaming
 */
router.post("/synthesize", async (req: Request, res: Response) => {
  try {
    const { text, emotion = "neutral" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Configure voice parameters based on emotion
    const voiceConfig = getVoiceConfig(emotion);

    if (ttsClient) {
      // Use Google Cloud TTS with prosody extraction
      const [response] = await ttsClient.synthesizeSpeech({
        input: { text },
        voice: voiceConfig.voice,
        audioConfig: {
          audioEncoding: "LINEAR16",
          sampleRateHertz: 16000,
          pitch: voiceConfig.pitch,
          speakingRate: voiceConfig.speakingRate,
        },
      });

      const audioContent = response.audioContent as Buffer;

      // Extract prosody from synthesized audio
      if (prosodyWss && audioContent) {
        extractAndBroadcastProsody(audioContent);
      }

      res.json({
        audio: audioContent.toString("base64"),
        format: "LINEAR16",
        sampleRate: 16000,
      });
    } else {
      // Fallback: Return text for client-side TTS
      res.json({
        text,
        fallback: true,
        message: "Using client-side TTS",
      });
    }
  } catch (error) {
    console.error("[TTS] Synthesis error:", error);
    res.status(500).json({ error: "TTS synthesis failed" });
  }
});

/**
 * POST /api/tts/stream
 * Stream TTS with real-time prosody (for future implementation)
 */
router.post("/stream", async (req: Request, res: Response) => {
  res.status(501).json({
    error: "Streaming TTS not yet implemented",
    message: "Use /synthesize endpoint for now",
  });
});

/**
 * Get voice configuration based on emotion
 */
function getVoiceConfig(emotion: string) {
  const configs: Record<string, any> = {
    low: {
      voice: { languageCode: "en-US", name: "en-US-Neural2-F" },
      pitch: -2.0,
      speakingRate: 0.85,
    },
    neutral: {
      voice: { languageCode: "en-US", name: "en-US-Neural2-F" },
      pitch: 0.0,
      speakingRate: 0.95,
    },
    high: {
      voice: { languageCode: "en-US", name: "en-US-Neural2-F" },
      pitch: 2.0,
      speakingRate: 1.05,
    },
    detached: {
      voice: { languageCode: "en-US", name: "en-US-Neural2-C" },
      pitch: -1.0,
      speakingRate: 0.8,
    },
  };

  return configs[emotion] || configs.neutral;
}

/**
 * Extract prosody from audio buffer and broadcast to WebSocket clients
 */
function extractAndBroadcastProsody(audioBuffer: Buffer): void {
  try {
    const frameSize = 1024;
    const hopSize = 512;
    const float32Array = new Float32Array(audioBuffer.length / 2);

    // Convert 16-bit PCM to Float32Array
    for (let i = 0; i < float32Array.length; i++) {
      const int16 = audioBuffer.readInt16LE(i * 2);
      float32Array[i] = int16 / 32768.0; // Normalize to -1.0 to 1.0
    }

    // Process in frames
    for (let i = 0; i < float32Array.length - frameSize; i += hopSize) {
      const frame = float32Array.slice(i, i + frameSize);
      const { pitchHz, energy } = analyzeProsody(frame, 16000);

      // Broadcast to connected clients
      if (prosodyWss) {
        broadcastProsody(prosodyWss, pitchHz, energy);
      }

      // Small delay to simulate real-time streaming
      // (in production, this would be handled by actual audio playback timing)
    }
  } catch (error) {
    console.error("[TTS] Prosody extraction error:", error);
  }
}

export default router;

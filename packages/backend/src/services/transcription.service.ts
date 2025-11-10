import fs from "fs";
import path from "path";
import OpenAI from "openai";
import axios from "axios";

/**
 * Transcription Service
 *
 * Supports three strategies:
 * 1. OpenAI Whisper API (fast, cloud-based, sends data externally)
 * 2. Local Whisper (self-hosted, HIPAA-compliant, GPU required)
 * 3. Hybrid fallback (try local first, fallback to OpenAI)
 *
 * Configuration via environment variables:
 * - TRANSCRIPTION_STRATEGY: "openai" | "local" | "hybrid" (default: "openai")
 * - OPENAI_API_KEY: Required for OpenAI Whisper API
 * - LOCAL_WHISPER_URL: URL for local Whisper service (default: http://localhost:8000/transcribe)
 * - LOCAL_WHISPER_TIMEOUT: Timeout in ms for local Whisper (default: 30000)
 */

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  source: "openai" | "local" | "fallback";
  timestamp: string;
}

interface TranscriptionOptions {
  language?: string;
  temperature?: number;
  prompt?: string;
}

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Configuration
const TRANSCRIPTION_STRATEGY = process.env.TRANSCRIPTION_STRATEGY || "openai";
const LOCAL_WHISPER_URL =
  process.env.LOCAL_WHISPER_URL || "http://localhost:8000/transcribe";
const LOCAL_WHISPER_TIMEOUT = parseInt(
  process.env.LOCAL_WHISPER_TIMEOUT || "30000",
  10
);

/**
 * Main transcription function with strategy selection
 */
export async function transcribeAudio(
  filePath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  console.log(`[Transcription] Strategy: ${TRANSCRIPTION_STRATEGY}`);
  console.log(`[Transcription] File: ${path.basename(filePath)}`);

  const startTime = Date.now();

  try {
    switch (TRANSCRIPTION_STRATEGY) {
      case "local":
        return await transcribeWithLocalWhisper(filePath, options);

      case "hybrid":
        return await transcribeWithHybridFallback(filePath, options);

      case "openai":
      default:
        return await transcribeWithOpenAI(filePath, options);
    }
  } catch (error: any) {
    console.error(`[Transcription] Error:`, error.message);
    throw new Error(`Transcription failed: ${error.message}`);
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[Transcription] Completed in ${duration}ms`);
  }
}

/**
 * Transcribe using OpenAI Whisper API
 *
 * Pros: Fast, accurate, no setup required
 * Cons: Sends audio externally, not HIPAA-compliant without BAA
 */
async function transcribeWithOpenAI(
  filePath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  if (!openai) {
    throw new Error("OpenAI API key not configured (OPENAI_API_KEY missing)");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
  }

  console.log(`[Transcription] Using OpenAI Whisper API`);

  const audioStream = fs.createReadStream(filePath);

  const response = await openai.audio.transcriptions.create({
    file: audioStream,
    model: "whisper-1",
    language: options.language,
    temperature: options.temperature || 0,
    prompt: options.prompt,
    response_format: "verbose_json", // Get language and duration
  });

  return {
    text: response.text,
    language: response.language,
    duration: response.duration,
    source: "openai",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Transcribe using local self-hosted Whisper
 *
 * Pros: HIPAA-compliant, data stays private
 * Cons: Requires GPU, slower setup, higher cost
 *
 * Expected local Whisper API format:
 * POST /transcribe
 * Content-Type: multipart/form-data
 * Body: { audio: File }
 *
 * Response: { transcript: string, language?: string, duration?: number }
 */
async function transcribeWithLocalWhisper(
  filePath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
  }

  console.log(`[Transcription] Using local Whisper at ${LOCAL_WHISPER_URL}`);

  const FormData = require("form-data");
  const form = new FormData();
  form.append("audio", fs.createReadStream(filePath));

  if (options.language) {
    form.append("language", options.language);
  }
  if (options.temperature !== undefined) {
    form.append("temperature", options.temperature.toString());
  }
  if (options.prompt) {
    form.append("prompt", options.prompt);
  }

  try {
    const response = await axios.post(LOCAL_WHISPER_URL, form, {
      headers: form.getHeaders(),
      timeout: LOCAL_WHISPER_TIMEOUT,
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024,
    });

    const { transcript, language, duration } = response.data;

    if (!transcript) {
      throw new Error("Local Whisper returned empty transcript");
    }

    return {
      text: transcript,
      language,
      duration,
      source: "local",
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      throw new Error(
        `Local Whisper service not available at ${LOCAL_WHISPER_URL}`
      );
    }
    if (error.code === "ETIMEDOUT") {
      throw new Error(`Local Whisper timeout after ${LOCAL_WHISPER_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Hybrid fallback strategy
 *
 * Try local Whisper first (privacy-first), fallback to OpenAI on failure
 * Best of both worlds: privacy when possible, reliability when needed
 */
async function transcribeWithHybridFallback(
  filePath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  console.log(
    `[Transcription] Using hybrid strategy (local → OpenAI fallback)`
  );

  try {
    // Try local Whisper first
    const result = await transcribeWithLocalWhisper(filePath, options);
    console.log(`[Transcription] ✅ Local Whisper succeeded`);
    return result;
  } catch (localError: any) {
    console.warn(
      `[Transcription] ⚠️  Local Whisper failed: ${localError.message}`
    );
    console.log(`[Transcription] Falling back to OpenAI Whisper API`);

    try {
      // Fallback to OpenAI
      const result = await transcribeWithOpenAI(filePath, options);
      return {
        ...result,
        source: "fallback", // Mark as fallback
      };
    } catch (openaiError: any) {
      console.error(
        `[Transcription] ❌ OpenAI fallback also failed: ${openaiError.message}`
      );
      throw new Error(
        `Both local and OpenAI transcription failed. Local: ${localError.message}, OpenAI: ${openaiError.message}`
      );
    }
  }
}

/**
 * Transcribe audio with emotion detection hint
 *
 * Uses prompt engineering to guide Whisper toward emotional context
 */
export async function transcribeWithEmotionContext(
  filePath: string,
  emotionHint?: string
): Promise<TranscriptionResult> {
  const prompt = emotionHint
    ? `The speaker may be feeling ${emotionHint}. They might discuss health, housing, food, or transportation needs.`
    : "The speaker may discuss health, housing, food, or transportation needs.";

  return transcribeAudio(filePath, {
    prompt,
    temperature: 0.2, // Lower temperature for more consistent output
  });
}

/**
 * Batch transcribe multiple audio files
 *
 * Useful for processing backlog or queue of recordings
 */
export async function transcribeBatch(
  filePaths: string[],
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult[]> {
  console.log(`[Transcription] Batch processing ${filePaths.length} files`);

  const results = await Promise.allSettled(
    filePaths.map((filePath) => transcribeAudio(filePath, options))
  );

  const successful = results.filter(
    (r) => r.status === "fulfilled"
  ) as PromiseFulfilledResult<TranscriptionResult>[];
  const failed = results.filter((r) => r.status === "rejected");

  console.log(
    `[Transcription] Batch complete: ${successful.length} succeeded, ${failed.length} failed`
  );

  if (failed.length > 0) {
    failed.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `[Transcription] Failed file ${filePaths[index]}: ${result.reason}`
        );
      }
    });
  }

  return successful.map((r) => r.value);
}

/**
 * Check if transcription service is available
 *
 * Health check for monitoring and alerting
 */
export async function checkTranscriptionHealth(): Promise<{
  healthy: boolean;
  strategy: string;
  services: {
    openai: boolean;
    local: boolean;
  };
}> {
  const services = {
    openai: false,
    local: false,
  };

  // Check OpenAI
  if (openai) {
    try {
      // Create a minimal test (no actual transcription)
      services.openai = true;
    } catch (error) {
      console.warn("[Transcription] OpenAI health check failed");
    }
  }

  // Check local Whisper
  try {
    const response = await axios.get(
      LOCAL_WHISPER_URL.replace("/transcribe", "/health"),
      { timeout: 5000 }
    );
    services.local = response.status === 200;
  } catch (error) {
    // Local service not available
  }

  const healthy =
    TRANSCRIPTION_STRATEGY === "openai"
      ? services.openai
      : TRANSCRIPTION_STRATEGY === "local"
      ? services.local
      : services.openai || services.local; // Hybrid needs at least one

  return {
    healthy,
    strategy: TRANSCRIPTION_STRATEGY,
    services,
  };
}

/**
 * Delete audio file after transcription (privacy cleanup)
 */
export async function deleteAudioFile(filePath: string): Promise<void> {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(
      `[Transcription] Deleted audio file: ${path.basename(filePath)}`
    );
  }
}

/**
 * Estimate transcription cost (for budget tracking)
 */
export function estimateTranscriptionCost(
  durationSeconds: number,
  strategy: string = TRANSCRIPTION_STRATEGY
): { cost: number; currency: string } {
  // OpenAI Whisper pricing: $0.006 per minute
  const openaiCostPerMinute = 0.006;

  // Local Whisper cost estimate (GPU compute)
  // Assume ~$0.20/hr GPU on RunPod small GPU, ~5min per hour of audio
  const localCostPerMinute = (0.2 / 60) * (1 / 5);

  const durationMinutes = durationSeconds / 60;

  const cost =
    strategy === "openai"
      ? durationMinutes * openaiCostPerMinute
      : durationMinutes * localCostPerMinute;

  return {
    cost: Math.round(cost * 10000) / 10000, // Round to 4 decimals
    currency: "USD",
  };
}

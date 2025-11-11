import OpenAI from "openai";
import { EmotionState } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TTSParams {
  text: string;
  emotion?: EmotionState | null;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

export const ttsService = {
  /**
   * Synthesize speech from text using OpenAI TTS API.
   * Returns base64-encoded audio data.
   *
   * Future: integrate with prosody.service for emotion-driven SSML modulation.
   */
  async synthesize(params: TTSParams): Promise<string> {
    const { text, emotion, voice = "nova" } = params;

    // Map emotion to voice selection (simple heuristic for now)
    let selectedVoice:
      | "alloy"
      | "echo"
      | "fable"
      | "onyx"
      | "nova"
      | "shimmer" = voice;
    if (emotion === "CALM") {
      selectedVoice = "nova"; // Warm, reassuring
    } else if (emotion === "GUARDED") {
      selectedVoice = "shimmer"; // Gentle, careful
    } else if (emotion === "LIT") {
      selectedVoice = "alloy"; // Energetic, supportive
    }

    try {
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: selectedVoice,
        input: text,
      });

      // Convert response to buffer then to base64
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      return buffer.toString("base64");
    } catch (error) {
      console.error("TTS synthesis error:", error);
      throw new Error("Failed to synthesize speech");
    }
  },

  /**
   * Generate a presigned URL or store audio file.
   * For MVP, we'll return inline base64 audio URLs (data:audio/mp3;base64,...).
   * In production, upload to S3/GCS and return a public URL.
   */
  async getAudioUrl(audioBase64: string): Promise<string> {
    // MVP: return data URL
    return `data:audio/mp3;base64,${audioBase64}`;
  },
};

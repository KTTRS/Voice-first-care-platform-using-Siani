import OpenAI from "openai";

const MOCK_MODE =
  !process.env.OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY === "your-openai-api-key";

const openai = MOCK_MODE
  ? null
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

export interface TranscribeParams {
  audioBase64: string;
  mimeType?: string; // e.g., "audio/webm", "audio/mp4", "audio/mpeg"
}

export const voiceService = {
  /**
   * Transcribe audio using OpenAI Whisper API.
   * Accepts base64-encoded audio and returns the transcribed text.
   */
  async transcribe(params: TranscribeParams): Promise<string> {
    const { audioBase64, mimeType = "audio/webm" } = params;

    // Mock mode for testing without OpenAI API key
    if (MOCK_MODE) {
      console.log(
        "⚠️  Voice Mock Mode: Returning placeholder transcription (OpenAI API key not configured)"
      );
      // Return a mock transcription for testing
      return "This is a mock transcription for testing purposes.";
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Determine file extension from mimeType
    let extension = "webm";
    if (mimeType.includes("mp4")) extension = "mp4";
    else if (mimeType.includes("mpeg") || mimeType.includes("mp3"))
      extension = "mp3";
    else if (mimeType.includes("wav")) extension = "wav";

    // Create a File-like object for OpenAI API
    const audioFile = new File([audioBuffer], `audio.${extension}`, {
      type: mimeType,
    });

    try {
      const response = await openai!.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en", // Adjust as needed or detect automatically
      });

      return response.text;
    } catch (error) {
      console.error("Voice transcription error:", error);
      throw new Error("Failed to transcribe audio");
    }
  },
};

import { Audio } from "expo-av";
import { useEmotionStore } from "../store/emotionStore";

/**
 * Voice Utilities - Passive Voice Recording & Wake-Word Detection
 *
 * Features:
 * - Passive background listening (wake-word: "Hey Siani")
 * - 20-30 second audio chunks
 * - Auto-send to backend for transcription
 * - Emotional cue detection trigger
 * - Avatar glow sync on voice activity
 */

export class VoiceManager {
  private recording: Audio.Recording | null = null;
  private isInitialized: boolean = false;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private chunkDuration: number = 25000; // 25 seconds

  /**
   * Initialize audio permissions and configuration
   */
  async initialize(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();

      if (status !== "granted") {
        console.warn("Audio permission not granted");
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true, // Passive listening in background
        shouldDuckAndroid: true,
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing voice manager:", error);
      return false;
    }
  }

  /**
   * Start passive voice recording
   * Records in chunks, auto-sends to backend
   */
  async startPassiveListening(
    onChunkReady: (audioUri: string) => Promise<void>
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Update store state
      useEmotionStore.getState().setListening(true);

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = newRecording;

      // Auto-stop and send chunk after duration
      this.recordingTimeout = setTimeout(async () => {
        await this.stopAndSendChunk(onChunkReady);
        // Restart for next chunk (continuous listening)
        await this.startPassiveListening(onChunkReady);
      }, this.chunkDuration);

      console.log("Passive listening started");
    } catch (error) {
      console.error("Error starting passive listening:", error);
      useEmotionStore.getState().setListening(false);
    }
  }

  /**
   * Stop current recording chunk and send to backend
   */
  private async stopAndSendChunk(
    onChunkReady: (audioUri: string) => Promise<void>
  ): Promise<void> {
    if (!this.recording) return;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      if (uri) {
        console.log("Audio chunk ready:", uri);
        await onChunkReady(uri);
      }

      this.recording = null;
    } catch (error) {
      console.error("Error stopping recording chunk:", error);
    }
  }

  /**
   * Stop passive listening completely
   */
  async stopPassiveListening(): Promise<void> {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    if (this.recording) {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
    }

    useEmotionStore.getState().setListening(false);
    console.log("Passive listening stopped");
  }

  /**
   * Start active (button-triggered) recording
   * For explicit Siani conversations
   */
  async startActiveRecording(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      useEmotionStore.getState().setListening(true);

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = newRecording;
      console.log("Active recording started");
    } catch (error) {
      console.error("Error starting active recording:", error);
      useEmotionStore.getState().setListening(false);
    }
  }

  /**
   * Stop active recording and return URI
   */
  async stopActiveRecording(): Promise<string | null> {
    if (!this.recording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      this.recording = null;
      useEmotionStore.getState().setListening(false);

      console.log("Active recording stopped:", uri);
      return uri;
    } catch (error) {
      console.error("Error stopping active recording:", error);
      return null;
    }
  }

  /**
   * Get current recording status
   */
  async getStatus(): Promise<Audio.RecordingStatus | null> {
    if (!this.recording) return null;
    return await this.recording.getStatusAsync();
  }
}

/**
 * Wake-Word Detection (Placeholder)
 *
 * In production, this would use:
 * - Porcupine Wake Word Detection
 * - Snowboy
 * - Custom ML model
 *
 * For now, we'll trigger on any voice activity detection
 */
export class WakeWordDetector {
  private isListening: boolean = false;
  private threshold: number = 0.5; // Voice activity threshold

  /**
   * Start wake-word detection
   * Monitors audio stream for "Hey Siani"
   */
  async startDetection(onWakeWordDetected: () => void): Promise<void> {
    this.isListening = true;

    // TODO: Integrate actual wake-word detection library
    // For MVP, we'll use a simpler approach or manual trigger

    console.log("Wake-word detection started (placeholder)");

    // Example: Check audio levels every 100ms
    // In production, use actual wake-word ML model
  }

  /**
   * Stop wake-word detection
   */
  stopDetection(): void {
    this.isListening = false;
    console.log("Wake-word detection stopped");
  }

  /**
   * Update detection threshold
   */
  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(1, threshold));
  }
}

/**
 * Audio Transcription Helper
 * Sends audio to backend for transcription
 */
export async function transcribeAudio(
  audioUri: string,
  apiUrl: string,
  token: string
): Promise<{ text: string; emotion?: string } | null> {
  try {
    const formData = new FormData();
    formData.append("audio", {
      uri: audioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);

    const response = await fetch(`${apiUrl}/api/voice/transcribe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Transcription failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return null;
  }
}

/**
 * Detect emotional cues from transcribed text
 * Triggers memory moment creation if emotional language detected
 */
export function detectEmotionalCues(text: string): {
  hasEmotion: boolean;
  detectedEmotion?: "anxious" | "motivated" | "calm";
  keywords: string[];
} {
  const anxiousKeywords = [
    "stressed",
    "anxious",
    "worried",
    "overwhelmed",
    "scared",
    "nervous",
    "tense",
    "panic",
    "afraid",
    "uncertain",
  ];

  const motivatedKeywords = [
    "excited",
    "motivated",
    "hopeful",
    "proud",
    "accomplished",
    "ready",
    "confident",
    "focused",
    "determined",
    "inspired",
  ];

  const calmKeywords = [
    "calm",
    "peaceful",
    "relaxed",
    "content",
    "grateful",
    "relieved",
    "comfortable",
    "safe",
    "settled",
    "centered",
  ];

  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];

  // Check for anxious cues
  const anxiousCount = anxiousKeywords.filter((keyword) => {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
      return true;
    }
    return false;
  }).length;

  // Check for motivated cues
  const motivatedCount = motivatedKeywords.filter((keyword) => {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
      return true;
    }
    return false;
  }).length;

  // Check for calm cues
  const calmCount = calmKeywords.filter((keyword) => {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
      return true;
    }
    return false;
  }).length;

  const hasEmotion = foundKeywords.length > 0;

  // Determine dominant emotion
  let detectedEmotion: "anxious" | "motivated" | "calm" | undefined;
  if (anxiousCount > motivatedCount && anxiousCount > calmCount) {
    detectedEmotion = "anxious";
  } else if (motivatedCount > anxiousCount && motivatedCount > calmCount) {
    detectedEmotion = "motivated";
  } else if (calmCount > 0) {
    detectedEmotion = "calm";
  }

  return {
    hasEmotion,
    detectedEmotion,
    keywords: foundKeywords,
  };
}

/**
 * Singleton instance
 */
export const voiceManager = new VoiceManager();
export const wakeWordDetector = new WakeWordDetector();

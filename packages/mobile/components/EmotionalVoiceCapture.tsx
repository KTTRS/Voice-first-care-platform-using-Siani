import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { analyzeVoice } from "../lib/api";

const VOICE_UPLOAD_TASK = "SianiVoiceUploadTask";
const VOICE_UPLOAD_QUEUE_KEY = "@siani_voice_upload_queue";
const MAX_UPLOAD_ATTEMPTS = 5;
const IMMEDIATE_RETRIES = 2;

interface VoiceAnalysisResult {
  transcription: string;
  emotion: string;
  intent?: string;
  sdohFlags?: string[];
  memoryMomentId: string;
  feedEventId?: string;
  needsIntervention: boolean;
  sianiResponse?: string;
}

interface PendingUpload {
  uri: string;
  userId: string;
  createdAt: number;
  attempts: number;
}

const getUploadQueue = async (): Promise<PendingUpload[]> => {
  try {
    const raw = await AsyncStorage.getItem(VOICE_UPLOAD_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingUpload[]) : [];
  } catch (error) {
    console.error("[VoiceCapture] Failed to read queue", error);
    return [];
  }
};

const saveUploadQueue = async (queue: PendingUpload[]) => {
  await AsyncStorage.setItem(VOICE_UPLOAD_QUEUE_KEY, JSON.stringify(queue));
};

const attemptUpload = async (upload: PendingUpload) => {
  await analyzeVoice(upload.uri, {
    userId: upload.userId,
    retryAttempt: String(upload.attempts + 1),
  });
};

const processNextUpload = async (): Promise<boolean> => {
  const queue = await getUploadQueue();
  if (!queue.length) return false;

  const next = queue[0];
  try {
    await attemptUpload(next);
    queue.shift();
    await saveUploadQueue(queue);
    return true;
  } catch (error) {
    console.warn("[VoiceCapture] Background upload failed", error);
    next.attempts += 1;
    if (next.attempts >= MAX_UPLOAD_ATTEMPTS) {
      queue.shift();
    } else {
      queue[0] = next;
    }
    await saveUploadQueue(queue);
    return false;
  }
};

let taskDefined = false;

const ensureTaskDefined = () => {
  if (taskDefined) return;

  TaskManager.defineTask(VOICE_UPLOAD_TASK, async () => {
    const didProcess = await processNextUpload();
    if (!didProcess) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  });

  taskDefined = true;
};

ensureTaskDefined();

const registerBackgroundUploadTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      VOICE_UPLOAD_TASK
    );

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(VOICE_UPLOAD_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (error) {
    console.error("[VoiceCapture] Failed to register background task", error);
  }
};

interface EmotionalVoiceCaptureProps {
  emotionState?: "calm" | "anxious" | "motivated" | "distressed";
  onTranscriptionReceived?: (text: string, emotion: string) => void;
  onEmotionDetected?: (emotion: string) => void;
  style?: any;
}

/**
 * Emotional Voice Capture Component
 *
 * Features:
 * - Records voice with emotion-aware UI
 * - Sends audio to backend for transcription
 * - Triggers SDOH detection and emotion analysis
 * - Integrates with Siani's emotional intelligence
 */
export default function EmotionalVoiceCapture({
  emotionState = "calm",
  onTranscriptionReceived,
  onEmotionDetected,
  style,
}: EmotionalVoiceCaptureProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Ready to listen");
  const [pulseAnim] = useState(new Animated.Value(1));
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(
    null
  );
  const [queuedUploads, setQueuedUploads] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Pulse animation for recording state
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  useEffect(() => {
    registerBackgroundUploadTask();
    refreshQueueCount();
    drainQueue();
  }, []);

  const refreshQueueCount = async () => {
    const queue = await getUploadQueue();
    setQueuedUploads(queue.length);
  };

  const drainQueue = async (): Promise<void> => {
    const processed = await processNextUpload();
    if (processed) {
      await refreshQueueCount();
      await drainQueue();
    }
  };

  const getEmotionColor = () => {
    switch (emotionState) {
      case "calm":
        return "#4CAF50"; // Green
      case "anxious":
        return "#FF9800"; // Orange
      case "motivated":
        return "#2196F3"; // Blue
      case "distressed":
        return "#F44336"; // Red
      default:
        return "#9C27B0"; // Purple
    }
  };

  const startRecording = async () => {
    try {
      console.log("[VoiceCapture] Requesting permissions...");
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        setStatus("Microphone permission denied");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("[VoiceCapture] Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setStatus("Listening...");
      setIsRecording(true);
    } catch (err) {
      console.error("[VoiceCapture] Failed to start recording:", err);
      setStatus("Error starting recording");
    }
  };

  const stopRecording = async () => {
    console.log("[VoiceCapture] Stopping recording...");
    if (!recording) return;

    try {
      setStatus("Processing...");
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log("[VoiceCapture] Recording saved:", uri);

      setIsRecording(false);
      setRecording(null);

      if (uri) {
        await sendToBackend(uri);
      }
    } catch (err) {
      console.error("[VoiceCapture] Failed to stop recording:", err);
      setStatus("Error processing");
    }
  };

  const sendToBackend = async (audioUri: string) => {
    try {
      setStatus("Analyzing...");
      setIsUploading(true);
      setErrorText(null);

      const userRaw = await AsyncStorage.getItem("user");
      const parsedUser = userRaw ? JSON.parse(userRaw) : null;
      const userId = parsedUser?.id;

      if (!userId) {
        throw new Error("Unable to find user profile");
      }

      let attempt = 0;
      let response: VoiceAnalysisResult | null = null;

      while (attempt < IMMEDIATE_RETRIES && !response) {
        try {
          response = await analyzeVoice(audioUri, { userId });
        } catch (error) {
          attempt += 1;
          if (attempt >= IMMEDIATE_RETRIES) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }

      if (!response) {
        throw new Error("Voice analysis failed");
      }

      setAnalysisResult(response);
      setStatus("Insight saved");

      if (onTranscriptionReceived) {
        onTranscriptionReceived(response.transcription, response.emotion);
      }

      if (onEmotionDetected) {
        onEmotionDetected(response.emotion);
      }
    } catch (err) {
      console.error("[VoiceCapture] Failed to send to backend:", err);
      setStatus("Saved for retry");
      const userRaw = await AsyncStorage.getItem("user");
      const parsedUser = userRaw ? JSON.parse(userRaw) : null;

      if (parsedUser?.id) {
        const queue = await getUploadQueue();
        queue.push({
          uri: audioUri,
          userId: parsedUser.id,
          createdAt: Date.now(),
          attempts: 0,
        });
        await saveUploadQueue(queue);
        setQueuedUploads(queue.length);
      }

      setErrorText(
        err instanceof Error ? err.message : "Unable to reach voice service"
      );
    }
    setIsUploading(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.statusText}>{status}</Text>

      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.8}
        disabled={isUploading}
      >
        <Animated.View
          style={[
            styles.recordButton,
            {
              backgroundColor: getEmotionColor(),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.recordButtonInner,
              isRecording && styles.recordButtonInnerActive,
            ]}
          />
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.instructionText}>
        {isRecording ? "🎙️ Tap to stop" : "👂 Tap to share"}
      </Text>

      <Text style={styles.emotionText}>Emotion: {emotionState}</Text>

      {queuedUploads > 0 && (
        <Text style={styles.queueText}>
          Pending uploads: {queuedUploads}. We'll retry in the background.
        </Text>
      )}

      {errorText && <Text style={styles.errorText}>{errorText}</Text>}

      {analysisResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Latest insight saved</Text>
          <Text style={styles.resultTranscription}>
            “{analysisResult.transcription}”
          </Text>
          <Text style={styles.resultMeta}>
            Emotion detected: {analysisResult.emotion}
            {analysisResult.intent ? ` • Intent: ${analysisResult.intent}` : ""}
          </Text>
          {analysisResult.sdohFlags && analysisResult.sdohFlags.length > 0 && (
            <Text style={styles.resultMeta}>
              SDOH flags: {analysisResult.sdohFlags.join(", ")}
            </Text>
          )}
          <Text style={styles.resultMeta}>
            Feed ID: {analysisResult.feedEventId || analysisResult.memoryMomentId}
          </Text>
          {analysisResult.sianiResponse && (
            <Text style={styles.resultResponse}>
              {analysisResult.sianiResponse}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  statusText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    fontWeight: "500",
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  recordButtonInnerActive: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    marginTop: 16,
  },
  emotionText: {
    fontSize: 14,
    color: "#333",
    marginTop: 16,
    fontWeight: "600",
  },
  queueText: {
    marginTop: 12,
    fontSize: 13,
    color: "#fb923c",
    textAlign: "center",
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: "#dc2626",
    textAlign: "center",
  },
  resultCard: {
    marginTop: 24,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: "100%",
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  resultTranscription: {
    fontSize: 15,
    color: "#0f172a",
    fontStyle: "italic",
    marginBottom: 8,
  },
  resultMeta: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  resultResponse: {
    marginTop: 12,
    fontSize: 14,
    color: "#0ea5e9",
  },
});

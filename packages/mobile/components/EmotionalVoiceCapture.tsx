import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  }, [isRecording]);

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

      // Get auth token
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        console.error("[VoiceCapture] No auth token or userId found");
        setStatus("Not authenticated");
        return;
      }

      // TODO: Implement audio upload endpoint
      // For now, we'll simulate the transcription and emotion detection

      // In production, this would:
      // 1. Upload audio file to backend
      // 2. Backend transcribes with Whisper/Deepgram
      // 3. Backend analyzes text for:
      //    - SDOH indicators (via sdohDetector)
      //    - Emotional state (sentiment analysis)
      //    - Intent/topics (mental health, loneliness, stress)
      // 4. Backend creates MemoryMoment with detected flags
      // 5. Backend triggers signal score update
      // 6. Backend returns transcription + analysis

      console.log("[VoiceCapture] Would send audio to /api/voice/analyze");

      // Simulate response
      setTimeout(() => {
        const mockTranscription =
          "I'm feeling a bit stressed about paying rent this month";
        const mockEmotion = "anxious";

        setStatus("Ready to listen");

        if (onTranscriptionReceived) {
          onTranscriptionReceived(mockTranscription, mockEmotion);
        }

        if (onEmotionDetected) {
          onEmotionDetected(mockEmotion);
        }
      }, 1500);
    } catch (err) {
      console.error("[VoiceCapture] Failed to send to backend:", err);
      setStatus("Analysis failed");
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.statusText}>{status}</Text>

      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.8}
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
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
});

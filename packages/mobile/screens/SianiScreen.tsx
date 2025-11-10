import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmotionAvatar from "../components/EmotionAvatar";
import { useEmotionStore } from "../store/emotionStore";
import { voiceManager } from "../utils/voice";
import * as Haptics from "expo-haptics";

/**
 * SianiScreen - Voice-First Conversation
 *
 * Design: Minimal, voice-focused, avatar-centric
 * Interaction: Auto-starts voice on entry, avatar glows with emotion
 */
export default function SianiScreen() {
  const {
    isListening,
    isSpeaking,
    currentEmotion,
    setListening,
    setSpeaking,
    setEmotion,
    addMemoryMoment,
  } = useEmotionStore();

  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-start passive listening on mount
  useEffect(() => {
    initializeVoice();

    return () => {
      voiceManager.stopPassiveListening();
    };
  }, []);

  const initializeVoice = async () => {
    try {
      await voiceManager.initialize();
      startListening();
    } catch (error) {
      console.error("Voice initialization failed:", error);
    }
  };

  const startListening = async () => {
    try {
      setListening(true);
      await voiceManager.startPassiveListening(async (audioUri) => {
        // Handle audio chunk (will integrate with backend in next step)
        console.log("Audio chunk received:", audioUri);

        // Placeholder: Simulate transcription
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
          // This will be replaced with actual API call
        }, 1500);
      });
    } catch (error) {
      console.error("Failed to start listening:", error);
      setListening(false);
    }
  };

  const stopListening = () => {
    voiceManager.stopPassiveListening();
    setListening(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Siani</Text>
          <Text style={styles.headerSubtext}>
            {isListening ? "Listening..." : "Tap to speak"}
          </Text>
        </View>

        {/* Central Avatar */}
        <View style={styles.avatarSection}>
          <EmotionAvatar
            size={180}
            floatingPosition="center"
            onPress={toggleListening}
          />

          {isProcessing && (
            <View style={styles.processingIndicator}>
              <ActivityIndicator size="small" color="#B8860B" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>

        {/* Current Emotion Indicator */}
        <View style={styles.emotionIndicator}>
          <View
            style={[
              styles.emotionDot,
              { backgroundColor: getEmotionColor(currentEmotion) },
            ]}
          />
          <Text style={styles.emotionText}>{currentEmotion}</Text>
        </View>

        {/* Transcript Display (Optional) */}
        {transcript && (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>Your Words</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}

        {/* Listening Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isListening && styles.controlButtonActive,
            ]}
            onPress={toggleListening}
          >
            <Text
              style={[
                styles.controlButtonText,
                isListening && styles.controlButtonTextActive,
              ]}
            >
              {isListening ? "Pause" : "Start Listening"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hint Text */}
        <Text style={styles.hintText}>
          Siani listens in the background and responds to emotional cues. You
          can also say "Hey Siani" to activate.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper to get emotion color
function getEmotionColor(emotion: string): string {
  switch (emotion) {
    case "calm":
      return "rgba(255, 182, 193, 0.8)";
    case "anxious":
      return "rgba(255, 193, 7, 0.8)";
    case "motivated":
      return "rgba(218, 165, 32, 0.9)";
    default:
      return "rgba(200, 200, 200, 0.8)";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F4",
  },
  content: {
    padding: 24,
    alignItems: "center",
    minHeight: "100%",
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  headerText: {
    fontSize: 42,
    fontFamily: "System", // Will use Playfair Display
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 15,
    color: "#8B8680",
    fontStyle: "italic",
  },
  avatarSection: {
    marginVertical: 60,
    alignItems: "center",
    position: "relative",
  },
  processingIndicator: {
    position: "absolute",
    bottom: -40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  processingText: {
    fontSize: 13,
    color: "#B8860B",
    fontStyle: "italic",
  },
  emotionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  emotionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emotionText: {
    fontSize: 16,
    color: "#1F1F1F",
    textTransform: "capitalize",
    fontWeight: "500",
  },
  transcriptCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  transcriptLabel: {
    fontSize: 12,
    color: "#8B8680",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    color: "#1F1F1F",
    lineHeight: 24,
  },
  controls: {
    marginTop: 30,
    width: "100%",
  },
  controlButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#D4CFC4",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: "#1F1F1F",
    borderColor: "#1F1F1F",
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F1F1F",
  },
  controlButtonTextActive: {
    color: "#F9F7F4",
  },
  hintText: {
    marginTop: 30,
    fontSize: 13,
    color: "#B0AAA5",
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
    maxWidth: 280,
  },
});

import React, { useState } from "react";
import { View, Text, StyleSheet, Animated, ScrollView } from "react-native";
import EmotionalVoiceCapture from "../components/EmotionalVoiceCapture";
import { useSianiResponse } from "../hooks/useSianiResponse";

/**
 * Example: Siani Conversation Screen
 *
 * This demonstrates how to integrate:
 * - Voice capture
 * - Emotion analysis
 * - Siani's empathetic responses
 * - Avatar glow effects
 */
export default function SianiConversationScreen() {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      sender: "user" | "siani";
      emotion?: string;
      timestamp: Date;
    }>
  >([]);

  const {
    sianiMessage,
    showSianiGlow,
    glowColor,
    currentEmotion,
    processSianiResponse,
  } = useSianiResponse();

  const handleTranscriptionReceived = (text: string, emotion: string) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text,
      sender: "user" as const,
      emotion,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
  };

  const handleVoiceAnalysisComplete = (result: any) => {
    // Process the full analysis result
    processSianiResponse(result);

    // Add Siani's response to chat
    if (result.sianiResponse) {
      const sianiMsg = {
        id: (Date.now() + 1).toString(),
        text: result.sianiResponse,
        sender: "siani" as const,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sianiMsg]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Siani Avatar with Glow */}
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            showSianiGlow && {
              shadowColor: glowColor,
              shadowOpacity: 0.8,
              shadowRadius: 20,
            },
          ]}
        >
          <Text style={styles.avatarText}>Siani</Text>
        </View>
        {showSianiGlow && (
          <Text style={styles.emotionLabel}>{currentEmotion}</Text>
        )}
      </View>

      {/* Chat Messages */}
      <ScrollView style={styles.chatContainer}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.message,
              msg.sender === "user" ? styles.userMessage : styles.sianiMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.sender === "siani" && styles.sianiMessageText,
              ]}
            >
              {msg.text}
            </Text>
            {msg.emotion && (
              <Text style={styles.emotionTag}>{msg.emotion}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Voice Capture */}
      <EmotionalVoiceCapture
        emotionState={mapEmotionToState(currentEmotion)}
        onTranscriptionReceived={handleTranscriptionReceived}
        onEmotionDetected={(emotion) => {
          console.log("Emotion detected:", emotion);
        }}
        style={styles.voiceCapture}
      />
    </View>
  );
}

// Map emotion levels to EmotionalVoiceCapture states
function mapEmotionToState(
  emotion: string
): "calm" | "anxious" | "motivated" | "distressed" {
  switch (emotion) {
    case "high":
      return "motivated";
    case "low":
      return "distressed";
    case "anxious":
    case "detached":
      return "anxious";
    case "calm":
    case "neutral":
    default:
      return "calm";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  avatarContainer: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#9C27B0",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  emotionLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#E3F2FD",
  },
  sianiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#9C27B0",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  sianiMessageText: {
    color: "#9C27B0",
  },
  emotionTag: {
    marginTop: 4,
    fontSize: 10,
    color: "#999",
    fontStyle: "italic",
  },
  voiceCapture: {
    paddingBottom: 40,
  },
});

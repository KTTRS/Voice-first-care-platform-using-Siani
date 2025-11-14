/**
 * Siani Voice Conversation Screen
 *
 * The core voice-first companion experience.
 * Design: Minimalist, dopamine-driven, culturally warm, non-surveillance.
 *
 * Features:
 * - Tap to speak (voice input)
 * - Real-time emotion-aware avatar
 * - Audio playback of Siani's responses
 * - Text fallback for accessibility
 * - Conversation history
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import SianiAvatar from "../components/SianiAvatar";
import WaveformVisualizer from "../components/WaveformVisualizer";
import { getToken } from "../lib/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  text: string;
  emotion?: string;
  audioUrl?: string;
  occurredAt: string;
}

export default function SianiScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<
    "CALM" | "GUARDED" | "LIT"
  >("CALM");
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadConversation();
    setupAudio();
  }, []);

  useEffect(() => {
    // Pulse animation for recording state
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

  const setupAudio = async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  };

  const loadConversation = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Get latest conversation
      const response = await fetch(
        `${API_URL}/api/siani/conversations?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const conversations = await response.json();
        if (conversations.length > 0) {
          const latestConvo = conversations[0];
          setConversationId(latestConvo.id);
          await loadHistory(latestConvo.id);
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const loadHistory = async (convoId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/siani/history/${convoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          100
        );
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const startRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        await sendVoiceMessage(uri);
      }

      setRecording(null);
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const sendVoiceMessage = async (audioUri: string) => {
    setIsProcessing(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // Read audio file and convert to base64
      const audioBlob = await fetch(audioUri).then((r) => r.blob());
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];

        const response = await fetch(`${API_URL}/api/siani/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId,
            audioBase64: base64Audio,
            audioMimeType: "audio/mp4",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reply = await response.json();

        // Update conversation ID if new
        if (!conversationId) {
          setConversationId(reply.conversationId);
        }

        // Add messages to UI
        setMessages((prev) => [
          ...prev,
          {
            id: reply.userMessageId,
            role: "USER",
            text: reply.text, // Backend returns the transcribed text
            occurredAt: new Date().toISOString(),
          },
          {
            id: reply.assistantMessageId,
            role: "ASSISTANT",
            text: reply.text,
            emotion: reply.emotion,
            audioUrl: reply.audioUrl,
            occurredAt: new Date().toISOString(),
          },
        ]);

        // Update emotion state
        setCurrentEmotion(reply.emotion);

        // Play Siani's audio response
        if (reply.audioUrl) {
          await playAudioResponse(reply.audioUrl);
        }

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          100
        );
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Error sending voice message:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioResponse = async (audioUrl: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case "CALM":
        return "#4ECDC4"; // Teal
      case "GUARDED":
        return "#FFB6C1"; // Soft pink
      case "LIT":
        return "#FFD700"; // Gold
      default:
        return "#A78BFA"; // Purple
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Siani</Text>
        <Text style={styles.headerSubtitle}>Your voice companion</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <SianiAvatar emotion={currentEmotion} size={120} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === "USER" ? styles.userBubble : styles.sianiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.role === "USER" ? styles.userText : styles.sianiText,
              ]}
            >
              {msg.text}
            </Text>
            {msg.emotion && (
              <View
                style={[
                  styles.emotionDot,
                  { backgroundColor: getEmotionColor(msg.emotion) },
                ]}
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Voice Input Button */}
      <View style={styles.inputContainer}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <Text style={styles.processingText}>Listening...</Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.8}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? "🎙️" : "Tap to speak"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1E",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#A0A0B0",
    marginTop: 4,
  },
  avatarContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 16,
    borderRadius: 20,
    marginVertical: 6,
    position: "relative",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2D2D44",
  },
  sianiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1E1E30",
    borderWidth: 1,
    borderColor: "#A78BFA33",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#E0E0E8",
  },
  sianiText: {
    color: "#F0F0F8",
  },
  emotionDot: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  recordButton: {
    backgroundColor: "#A78BFA",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: "#FF6B9D",
  },
  recordButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  processingContainer: {
    alignItems: "center",
  },
  processingText: {
    color: "#A78BFA",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "500",
  },
});

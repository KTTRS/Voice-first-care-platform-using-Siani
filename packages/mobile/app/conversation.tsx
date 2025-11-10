import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import SianiAvatar from "../components/SianiAvatar";
import WaveformVisualizer from "../components/WaveformVisualizer";
import { colors, spacing, typography } from "../theme/luxury";

interface Message {
  id: string;
  text: string;
  sender: "user" | "siani";
  timestamp: Date;
}

/**
 * Conversation Screen - Voice-first interaction with Siani
 *
 * Design Philosophy:
 * - Voice is primary, text is secondary
 * - Siani avatar is always visible and responsive
 * - Waveform shows audio activity
 * - Minimal UI, maximum focus on conversation
 * - Luxurious, calming aesthetic
 */
export default function ConversationScreen() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hey, I'm here. What's on your mind?",
      sender: "siani",
      timestamp: new Date(),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Request audio permissions
    requestAudioPermissions();
  }, []);

  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Audio permission not granted");
      }
    } catch (error) {
      console.error("Error requesting audio permissions:", error);
    }
  };

  const startListening = async () => {
    try {
      // Haptic feedback
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsListening(true);

      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopListening = async () => {
    try {
      if (!recording) return;

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsListening(false);

      console.log("Recording stopped, saved at:", uri);

      // TODO: Send audio to backend for transcription
      // For now, simulate transcription
      simulateTranscription();

      // Haptic feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsListening(false);
    }
  };

  const simulateTranscription = () => {
    // Simulate user message after transcription
    const userMessage: Message = {
      id: Date.now().toString(),
      text: "I've been feeling overwhelmed with everything lately.",
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate Siani's response
    setTimeout(() => {
      speakResponse("Ugh, that sounds really tough. Want to talk about it?");
    }, 1000);
  };

  const speakResponse = (text: string) => {
    const sianiMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "siani",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, sianiMessage]);

    // Speak the text
    setIsSpeaking(true);
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9, // Slightly slower for warmth
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleAvatarPress = () => {
    if (isListening) {
      stopListening();
    } else if (!isSpeaking) {
      startListening();
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Siani</Text>
        <Text style={styles.headerSubtitle}>
          {isListening
            ? "I'm listening..."
            : isSpeaking
            ? "..."
            : "Tap to talk"}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.sender === "user"
                ? styles.userBubble
                : styles.sianiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.sender === "user" ? styles.userText : styles.sianiText,
              ]}
            >
              {message.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                message.sender === "user"
                  ? styles.userTimestamp
                  : styles.sianiTimestamp,
              ]}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Waveform Visualizer */}
      <View style={styles.visualizerContainer}>
        <WaveformVisualizer
          isActive={isListening || isSpeaking}
          type={isListening ? "listening" : "speaking"}
        />
      </View>

      {/* Siani Avatar (center, always visible) */}
      <View style={styles.avatarContainer}>
        <SianiAvatar
          size={160}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onPress={handleAvatarPress}
        />
      </View>

      {/* Instructions */}
      {messages.length === 1 && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap Siani to start a conversation
          </Text>
          <Text style={styles.instructionsSubtext}>
            She'll listen and respond naturally
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.semibold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
    marginTop: 4,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.text.primary,
  },
  sianiBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  messageText: {
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  userText: {
    color: colors.background,
    fontFamily: typography.fonts.regular,
  },
  sianiText: {
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
  },
  timestamp: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: typography.fonts.regular,
  },
  sianiTimestamp: {
    color: colors.text.disabled,
    fontFamily: typography.fonts.regular,
  },
  visualizerContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: -40,
    zIndex: 1,
  },
  avatarContainer: {
    position: "absolute",
    bottom: spacing.xxxl,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: spacing.xxxl + 180,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  instructionsText: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.medium,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 4,
  },
  instructionsSubtext: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});

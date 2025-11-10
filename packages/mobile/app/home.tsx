import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Alert,
  Modal,
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
import { getGoals, getFeed, getUser, syncSianiData } from "../lib/api";
import {
  processMessage,
  acceptResourceOffer as acceptResource,
  declineResourceOffer as declineResource,
} from "../lib/conversationEngine";
import { Resource } from "../lib/resourceEngine";
import { sianiMemory } from "../lib/sianiMemory";
import { memoryVectorStore } from "../lib/memoryVectorEngine";
import { getFollowUpForConversation } from "../lib/followUpEngine";

const { width, height } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "user" | "siani";
  timestamp: Date;
  resourceOffer?: {
    resource: Resource;
    interactionId: string;
  };
}

export default function Home() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Resource offer modal state
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [currentResourceOffer, setCurrentResourceOffer] = useState<{
    resource: Resource;
    interactionId: string;
  } | null>(null);

  // Breathing animation for avatar
  const breathAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Breathing animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.08,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Load context and send welcome message
    initializeSiani();
  }, []);

  const initializeSiani = async () => {
    try {
      // Get current user
      const user = await getUser();
      if (user) {
        setUserId(user.id.toString());
        sianiMemory.setUserId(user.id.toString());
      }

      // Silently fetch goals + feed for context enrichment
      const [goals, feed] = await Promise.all([getGoals(), getFeed()]);

      // Start conversation
      const convId = sianiMemory.startConversation();
      setConversationId(convId);

      // Wait a moment, then greet naturally
      setTimeout(() => {
        addSianiMessage("Hey, I was just thinking about you…");
      }, 1500);
    } catch (error) {
      console.error("Failed to initialize context:", error);
      // Still greet even if context fails
      addSianiMessage("Hey, I was just thinking about you…");
    }
  };

  const addSianiMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "siani",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Speak the message
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9, // Slightly slower, more intimate
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
    });
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const handleAvatarPress = async () => {
    // Haptic feedback - subtle, wave-like
    if (Platform.OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isListening) {
      // Stop listening
      stopListening();
    } else {
      // Start listening
      startListening();
    }
  };

  const startListening = async () => {
    setIsListening(true);

    // Request microphone permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Microphone access is required to talk with Siani"
      );
      setIsListening(false);
      return;
    }

    // TODO: Implement actual speech-to-text
    // For now, simulate with a timeout
    setTimeout(() => {
      simulateUserMessage();
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const simulateUserMessage = async () => {
    setIsListening(false);

    if (!userId) {
      console.error("No user ID available");
      return;
    }

    // Simulate user speech input
    const userText =
      "I've been having trouble getting to the store because the bus keeps not showing up";
    addUserMessage(userText);

    // Process message with full intelligence engine
    try {
      const response = await processMessage(
        userId,
        userText,
        conversationId || undefined
      );

      // Show "Siani is thinking..." briefly
      setTimeout(async () => {
        // Add Siani's empathy/response
        addSianiMessage(response.reply);

        // If SDOH detected and resource should be offered
        if (
          response.sdohDetection?.resourceOffer?.shouldOffer &&
          response.sdohDetection.resourceOffer.resource
        ) {
          // Wait a beat, then offer resource
          setTimeout(() => {
            const offerText =
              response.sdohDetection!.resourceOffer!.offerText ||
              "I actually found something that might help with this. Want to check it out?";

            addSianiMessage(offerText);

            // Show resource offer modal
            setCurrentResourceOffer({
              resource: response.sdohDetection!.resourceOffer!.resource!,
              interactionId: response.memoryMoment!.id, // Use memory moment ID as interaction ID
            });
            setShowResourceModal(true);
          }, 2000);
        }

        // If there's a follow-up to mention
        if (response.followUp?.message) {
          setTimeout(() => {
            addSianiMessage(response.followUp!.message!);
          }, 4000);
        }

        // Sync data to backend
        syncToBackend();
      }, 800);
    } catch (error) {
      console.error("Error processing message:", error);
      // Fallback response
      addSianiMessage("I'm listening. Tell me more about that.");
    }
  };

  const syncToBackend = async () => {
    try {
      const moments = sianiMemory.getAllMoments();
      const vectors = memoryVectorStore.getAllVectors();

      await syncSianiData({
        moments,
        vectors,
      });

      // Clear synced data from local cache
      sianiMemory.clearSyncedMoments(moments.map((m) => m.id));
      memoryVectorStore.clearSyncedVectors(vectors.map((v) => v.id));
    } catch (error) {
      console.error("Failed to sync data:", error);
      // Don't block user experience on sync failure
    }
  };

  const handleAcceptResource = () => {
    if (!currentResourceOffer) return;

    const { resource, interactionId } = currentResourceOffer;
    const { nextSteps } = acceptResource(interactionId);

    setShowResourceModal(false);

    // Show resource details as message
    setTimeout(() => {
      addSianiMessage(nextSteps);
    }, 300);

    // Optionally show resource card/details
    // For now, just acknowledge
    setTimeout(() => {
      addSianiMessage(
        "I'll send you the details. Let me know if you need help with anything!"
      );
    }, 1500);

    setCurrentResourceOffer(null);
  };

  const handleDeclineResource = () => {
    if (!currentResourceOffer) return;

    const { interactionId } = currentResourceOffer;
    const response = declineResource(interactionId);

    setShowResourceModal(false);

    // Show understanding response
    setTimeout(() => {
      addSianiMessage(response);
    }, 300);

    setCurrentResourceOffer(null);
  };

  if (!fontsLoaded) {
    return null;
  }

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Messages - only show if there are any */}
        {messages.length > 0 && (
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <MessageBubble key={message.id} message={message} index={index} />
            ))}
          </ScrollView>
        )}

        {/* Siani Avatar - Centered, Glowing */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleAvatarPress}>
            {/* Outer glow rings */}
            <Animated.View
              style={[
                styles.glowRing,
                styles.glowRingOuter,
                {
                  opacity: glowOpacity,
                  transform: [{ scale: breathAnim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.glowRing,
                styles.glowRingMiddle,
                {
                  opacity: glowOpacity,
                  transform: [{ scale: breathAnim }],
                },
              ]}
            />

            {/* Main avatar circle */}
            <Animated.View
              style={[
                styles.avatar,
                {
                  transform: [{ scale: breathAnim }],
                  borderColor: isListening ? "#1F1F1F" : "#E8E3D9",
                  borderWidth: isListening ? 3 : 2,
                },
              ]}
            >
              {isListening && (
                <View style={styles.listeningIndicator}>
                  <View style={styles.listeningDot} />
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Subtle state hint */}
          <Text style={styles.stateHint}>
            {isListening ? "Listening…" : "Tap to speak"}
          </Text>
        </View>
      </Animated.View>

      {/* Resource Offer Modal */}
      <Modal
        visible={showResourceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResourceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentResourceOffer && (
              <>
                <Text style={styles.modalTitle}>
                  {currentResourceOffer.resource.title}
                </Text>
                <Text style={styles.modalDescription}>
                  {currentResourceOffer.resource.description}
                </Text>

                {currentResourceOffer.resource.contactInfo.phone && (
                  <Text style={styles.modalContact}>
                    📞 {currentResourceOffer.resource.contactInfo.phone}
                  </Text>
                )}

                {currentResourceOffer.resource.contactInfo.website && (
                  <Text style={styles.modalContact}>
                    🌐 {currentResourceOffer.resource.contactInfo.website}
                  </Text>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonAccept]}
                    onPress={handleAcceptResource}
                  >
                    <Text style={styles.modalButtonTextAccept}>
                      Yes, send it to me
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonDecline]}
                    onPress={handleDeclineResource}
                  >
                    <Text style={styles.modalButtonTextDecline}>
                      Not right now
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Message bubble component with fade-in animation
const MessageBubble: React.FC<{ message: Message; index: number }> = ({
  message,
  index,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isSiani = message.sender === "siani";

  return (
    <Animated.View
      style={[
        styles.messageBubble,
        isSiani ? styles.sianiMessage : styles.userMessage,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text
        style={[
          styles.messageText,
          isSiani ? styles.sianiText : styles.userText,
        ]}
      >
        {message.text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F4", // Warm off-white, like aged linen
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  messagesContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  messageBubble: {
    maxWidth: "75%",
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },
  sianiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E3D9",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#1F1F1F", // Matte black
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
    letterSpacing: -0.2,
  },
  sianiText: {
    color: "#1F1F1F",
  },
  userText: {
    color: "#F9F7F4",
  },
  avatarContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
    borderRadius: 1000,
    borderWidth: 1,
  },
  glowRingOuter: {
    width: 200,
    height: 200,
    top: -40,
    left: -40,
    borderColor: "#D4CFC4",
  },
  glowRingMiddle: {
    width: 160,
    height: 160,
    top: -20,
    left: -20,
    borderColor: "#E8E3D9",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  listeningIndicator: {
    width: 16,
    height: 16,
  },
  listeningDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1F1F1F",
  },
  stateHint: {
    marginTop: 20,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9B968C",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(31, 31, 31, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: "#F9F7F4",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#E8E3D9",
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    color: "#1F1F1F",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#4A4540",
    lineHeight: 24,
    marginBottom: 20,
  },
  modalContact: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B6560",
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  modalButtons: {
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonAccept: {
    backgroundColor: "#1F1F1F",
  },
  modalButtonDecline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4CFC4",
  },
  modalButtonTextAccept: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#F9F7F4",
    letterSpacing: -0.2,
  },
  modalButtonTextDecline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#6B6560",
    letterSpacing: -0.2,
  },
});

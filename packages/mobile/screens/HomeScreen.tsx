import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import EmotionAvatar from "../components/EmotionAvatar";
import { useEmotionStore } from "../store/emotionStore";

/**
 * HomeScreen - Welcome & Onboarding
 *
 * Design: Invite-only, luxurious welcome
 * Tone: "Quietly elegant, emotionally present"
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, currentEmotion } = useEmotionStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.welcomeText}>
          Welcome{user?.name ? `, ${user.name}` : ""}
        </Text>
        <Text style={styles.subtitle}>
          Your personal companion for emotional clarity and growth
        </Text>
      </View>

      {/* Siani Avatar (center) */}
      <View style={styles.avatarContainer}>
        <EmotionAvatar
          size={140}
          floatingPosition="center"
          onPress={() => navigation.navigate("Siani" as never)}
        />
        <Text style={styles.avatarHint}>
          Tap to start a conversation with Siani
        </Text>
      </View>

      {/* Current Emotion State */}
      <View style={styles.emotionCard}>
        <Text style={styles.emotionLabel}>Your Energy Right Now</Text>
        <Text style={styles.emotionValue}>{currentEmotion}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Feed" as never)}
        >
          <Text style={styles.actionText}>View Your Journey</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate("Profile" as never)}
        >
          <Text style={[styles.actionText, styles.secondaryText]}>
            Your Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Invite-Only Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>✨ Invite-Only Experience</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F4",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  hero: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 36,
    fontFamily: "System", // Will be replaced with Playfair Display
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B6560",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  avatarContainer: {
    marginVertical: 40,
    alignItems: "center",
  },
  avatarHint: {
    marginTop: 20,
    fontSize: 14,
    color: "#8B8680",
    fontStyle: "italic",
  },
  emotionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    width: "100%",
  },
  emotionLabel: {
    fontSize: 13,
    color: "#8B8680",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  emotionValue: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1F1F1F",
    textTransform: "capitalize",
  },
  actions: {
    marginTop: 20,
    width: "100%",
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#D4CFC4",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9F7F4",
  },
  secondaryText: {
    color: "#1F1F1F",
  },
  badge: {
    marginTop: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(218, 165, 32, 0.1)",
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    color: "#B8860B",
    fontWeight: "500",
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEmotionStore, Goal } from "../store/emotionStore";
import * as Haptics from "expo-haptics";

/**
 * ProfileScreen - User Settings & Goals
 *
 * Design: Personal dashboard with progress tracking
 * Features: Token management, goals, streak tracking
 */
export default function ProfileScreen() {
  const { user, token, goals, setToken, setGoals, currentEmotion } =
    useEmotionStore();

  const [isEditingToken, setIsEditingToken] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      Alert.alert("Error", "Please enter a valid token");
      return;
    }

    await setToken(tokenInput.trim());
    setIsEditingToken(false);
    setTokenInput("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Authentication token saved securely");
  };

  const handleClearToken = () => {
    Alert.alert(
      "Clear Token",
      "Are you sure you want to remove your authentication token?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await setToken("");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const renderGoalCard = (goal: Goal) => (
    <View key={goal.id} style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <Text style={styles.goalProgress}>{goal.progress}%</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${goal.progress}%` }]} />
      </View>

      {goal.category && (
        <Text style={styles.goalCategory}>{goal.category}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Your Profile</Text>
          <Text style={styles.headerSubtext}>
            {user?.name || "Welcome to Siani"}
          </Text>
        </View>

        {/* Current Emotion State */}
        <View style={styles.emotionCard}>
          <Text style={styles.sectionLabel}>Current Energy</Text>
          <View style={styles.emotionRow}>
            <View
              style={[
                styles.emotionIndicator,
                { backgroundColor: getEmotionColor(currentEmotion) },
              ]}
            />
            <Text style={styles.emotionValue}>{currentEmotion}</Text>
          </View>
        </View>

        {/* Authentication Token */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Authentication</Text>

          {!isEditingToken ? (
            <View style={styles.tokenDisplay}>
              <Text style={styles.tokenStatus}>
                {token ? "✓ Token configured" : "⚠ No token set"}
              </Text>
              <View style={styles.tokenActions}>
                <TouchableOpacity
                  style={styles.tokenButton}
                  onPress={() => setIsEditingToken(true)}
                >
                  <Text style={styles.tokenButtonText}>
                    {token ? "Update" : "Set Token"}
                  </Text>
                </TouchableOpacity>

                {token && (
                  <TouchableOpacity
                    style={[styles.tokenButton, styles.tokenButtonDanger]}
                    onPress={handleClearToken}
                  >
                    <Text style={styles.tokenButtonTextDanger}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.tokenEditor}>
              <TextInput
                style={styles.tokenInput}
                placeholder="Enter your authentication token"
                placeholderTextColor="#B0AAA5"
                value={tokenInput}
                onChangeText={setTokenInput}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <View style={styles.tokenEditorActions}>
                <TouchableOpacity
                  style={styles.tokenButton}
                  onPress={handleSaveToken}
                >
                  <Text style={styles.tokenButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tokenButton, styles.tokenButtonSecondary]}
                  onPress={() => {
                    setIsEditingToken(false);
                    setTokenInput("");
                  }}
                >
                  <Text style={styles.tokenButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Personal Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Goals</Text>

          {goals.length > 0 ? (
            <View style={styles.goalsContainer}>
              {goals.map(renderGoalCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No goals yet. Start a conversation with Siani to set your first
                goal.
              </Text>
            </View>
          )}
        </View>

        {/* Progress Streak (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Progress Streak</Text>
          <View style={styles.streakCard}>
            <Text style={styles.streakNumber}>0</Text>
            <Text style={styles.streakLabel}>days</Text>
            <Text style={styles.streakSubtext}>
              Keep engaging with Siani to build your streak
            </Text>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Your data is encrypted and stored securely. Siani never shares
            your conversations or personal information.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
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
  },
  header: {
    marginBottom: 30,
  },
  headerText: {
    fontSize: 36,
    fontFamily: "System", // Will use Playfair Display
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 6,
  },
  headerSubtext: {
    fontSize: 15,
    color: "#8B8680",
  },
  emotionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  emotionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emotionIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emotionValue: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1F1F1F",
    textTransform: "capitalize",
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#8B8680",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: "500",
  },
  tokenDisplay: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  tokenStatus: {
    fontSize: 15,
    color: "#1F1F1F",
    marginBottom: 14,
  },
  tokenActions: {
    flexDirection: "row",
    gap: 10,
  },
  tokenButton: {
    backgroundColor: "#1F1F1F",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flex: 1,
    alignItems: "center",
  },
  tokenButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#D4CFC4",
  },
  tokenButtonDanger: {
    backgroundColor: "#DC3545",
  },
  tokenButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F9F7F4",
  },
  tokenButtonTextSecondary: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F1F1F",
  },
  tokenButtonTextDanger: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F9F7F4",
  },
  tokenEditor: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  tokenInput: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1F1F1F",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8E3DC",
  },
  tokenEditorActions: {
    flexDirection: "row",
    gap: 10,
  },
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F1F1F",
    flex: 1,
  },
  goalProgress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#B8860B",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "rgba(218, 165, 32, 0.2)",
    borderRadius: 3,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#DAA520",
    borderRadius: 3,
  },
  goalCategory: {
    fontSize: 12,
    color: "#8B8680",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyState: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    color: "#8B8680",
    textAlign: "center",
    lineHeight: 20,
  },
  streakCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: "#B8860B",
  },
  streakLabel: {
    fontSize: 16,
    color: "#8B8680",
    marginBottom: 8,
  },
  streakSubtext: {
    fontSize: 13,
    color: "#B0AAA5",
    textAlign: "center",
    fontStyle: "italic",
  },
  privacyNote: {
    backgroundColor: "rgba(218, 165, 32, 0.08)",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  privacyText: {
    fontSize: 12,
    color: "#6B6560",
    lineHeight: 18,
    textAlign: "center",
  },
});

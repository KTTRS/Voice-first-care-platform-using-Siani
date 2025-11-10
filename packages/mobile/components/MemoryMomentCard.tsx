import React from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

interface MemoryMomentCardProps {
  moment: {
    text: string;
    mood?: string;
    sentiment?: number;
    timestamp: Date;
    tags?: string[];
  };
  style?: any;
}

/**
 * MemoryMomentCard - Display a captured conversation moment
 *
 * Design Philosophy:
 * - Subtle, elegant card design (old money aesthetic)
 * - Shows emotional context without being clinical
 * - Uses serif font for elevated feel
 * - Muted colors, gold accents
 */
export default function MemoryMomentCard({
  moment,
  style,
}: MemoryMomentCardProps) {
  const getMoodColor = (mood?: string): string => {
    const moodColors: Record<string, string> = {
      hopeful: "#8BC34A",
      overwhelmed: "#FF5722",
      grateful: "#4CAF50",
      anxious: "#FF9800",
      relieved: "#00BCD4",
      frustrated: "#F44336",
      sad: "#9E9E9E",
      content: "#2196F3",
      stressed: "#FF5722",
      lonely: "#9C27B0",
      burnt_out: "#795548",
      angry: "#D32F2F",
      neutral: "#757575",
    };
    return moodColors[mood || "neutral"] || "#757575";
  };

  const getMoodEmoji = (mood?: string): string => {
    const moodEmojis: Record<string, string> = {
      hopeful: "🌟",
      overwhelmed: "😰",
      grateful: "🙏",
      anxious: "😟",
      relieved: "😌",
      frustrated: "😤",
      sad: "😔",
      content: "😊",
      stressed: "😓",
      lonely: "😞",
      burnt_out: "😵",
      angry: "😠",
      neutral: "😐",
    };
    return moodEmojis[mood || "neutral"] || "💭";
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const getSentimentText = (sentiment?: number): string => {
    if (!sentiment) return "";
    if (sentiment > 0.5) return "Very positive";
    if (sentiment > 0) return "Positive";
    if (sentiment < -0.5) return "Struggling";
    if (sentiment < 0) return "Difficult";
    return "Neutral";
  };

  return (
    <View style={[styles.card, style]}>
      {/* Header with mood indicator */}
      <View style={styles.header}>
        <View
          style={[
            styles.moodIndicator,
            { backgroundColor: getMoodColor(moment.mood) + "20" },
          ]}
        >
          <Text style={styles.moodEmoji}>{getMoodEmoji(moment.mood)}</Text>
        </View>
        <View style={styles.headerText}>
          {moment.mood && (
            <Text
              style={[styles.moodLabel, { color: getMoodColor(moment.mood) }]}
            >
              {moment.mood.replace(/_/g, " ")}
            </Text>
          )}
          <Text style={styles.timeText}>{formatTime(moment.timestamp)}</Text>
        </View>
      </View>

      {/* Memory text */}
      <Text style={styles.memoryText}>{moment.text}</Text>

      {/* Footer with tags and sentiment */}
      <View style={styles.footer}>
        {moment.tags && moment.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {moment.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {moment.sentiment !== undefined && (
          <Text style={styles.sentimentText}>
            {getSentimentText(moment.sentiment)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F9F7F4", // Off-white, warm
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8E3D9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  moodIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  moodEmoji: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: "#8B8680",
    fontFamily: "Inter_400Regular",
  },
  memoryText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#2B2420",
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  tag: {
    backgroundColor: "#E8E3D9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: "#6B6560",
    fontFamily: "Inter_500Medium",
  },
  sentimentText: {
    fontSize: 12,
    color: "#8B8680",
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
  },
});

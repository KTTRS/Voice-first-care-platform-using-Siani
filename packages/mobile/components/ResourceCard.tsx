import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  ResourceEngagement,
  getNeedTypeLabel,
  getNeedTypeIcon,
  getStatusLabel,
  getStatusColor,
} from "../hooks/useSDOHSync";

interface ResourceCardProps {
  engagement: ResourceEngagement;
  onPress: () => void;
}

/**
 * Glassmorphic card displaying a resource engagement
 * Shows icon, title, status, and detection context
 */
export function ResourceCard({ engagement, onPress }: ResourceCardProps) {
  const icon = getNeedTypeIcon(engagement.needType);
  const title =
    engagement.resourceName || getNeedTypeLabel(engagement.needType);
  const statusLabel = getStatusLabel(engagement.status);
  const statusColor = getStatusColor(engagement.status);

  // Extract brief context (first 80 chars)
  const context = engagement.detectionContext
    ? engagement.detectionContext.substring(0, 80) + "..."
    : "Detected from conversation";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Glassmorphic background */}
      <View style={styles.glassBackground} />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon and Title */}
        <View style={styles.header}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.context}>{context}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Arrow indicator */}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  glassBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    // Note: backdropFilter not supported in React Native
    // Will need to use react-native-blur or similar library for true glassmorphism
  },
  content: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  context: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  arrow: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  arrowText: {
    fontSize: 24,
    color: "#9CA3AF",
    fontWeight: "300",
  },
});

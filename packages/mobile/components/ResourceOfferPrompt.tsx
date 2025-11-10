import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import {
  ResourceEngagement,
  getNeedTypeLabel,
  getNeedTypeIcon,
} from "../hooks/useSDOHSync";

interface ResourceOfferPromptProps {
  engagement: ResourceEngagement;
  visible: boolean;
  onShowMe: () => void;
  onDismiss: () => void;
}

/**
 * Soft, non-intrusive toast-style banner that appears when Siani detects a need
 * Slides in from top, dismissible, with "Show me" action
 */
export function ResourceOfferPrompt({
  engagement,
  visible,
  onShowMe,
  onDismiss,
}: ResourceOfferPromptProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const icon = getNeedTypeIcon(engagement.needType);
  const title = getNeedTypeLabel(engagement.needType);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // Auto-dismiss after 8 seconds if not interacted with
      const timeout = setTimeout(() => {
        handleDismiss();
      }, 8000);

      return () => clearTimeout(timeout);
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Glassmorphic background */}
      <View style={styles.glassBackground} />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon and Text */}
        <View style={styles.messageContainer}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              I noticed you might need help with {title.toLowerCase()}
            </Text>
            <Text style={styles.subtitle}>Want help with this?</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.showButton]}
            onPress={onShowMe}
            activeOpacity={0.8}
          >
            <Text style={styles.showButtonText}>Show me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissButtonText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60, // Below status bar
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 16,
    overflow: "hidden",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  glassBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(139, 92, 246, 0.95)", // Purple with high opacity
    backdropFilter: "blur(20px)",
  },
  content: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 4,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "400",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  showButton: {
    backgroundColor: "#FFFFFF",
  },
  showButtonText: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "600",
  },
  dismissButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dismissButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

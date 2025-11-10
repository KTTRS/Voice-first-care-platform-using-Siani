import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  gradient?: boolean;
}

/**
 * GlassmorphicCard - Luxury card with blur effect
 *
 * Design: Rounded corners, subtle shadow, frosted glass aesthetic
 */
export default function GlassmorphicCard({
  children,
  style,
  onPress,
  gradient = false,
}: GlassmorphicCardProps) {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[styles.card, gradient && styles.gradientCard, style]}
      >
        <View style={styles.content}>{children}</View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, gradient && styles.gradientCard, style]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: "hidden",
  },
  gradientCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    padding: 20,
  },
});

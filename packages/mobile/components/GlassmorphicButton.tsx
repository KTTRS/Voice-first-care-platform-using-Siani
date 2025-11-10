import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

interface GlassmorphicButtonProps {
  children: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

/**
 * GlassmorphicButton - Luxury button with haptic feedback
 *
 * Design: Rounded, gradient background, gold accent when active
 */
export default function GlassmorphicButton({
  children,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
}: GlassmorphicButtonProps) {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[
      `${size}Button` as keyof typeof styles
    ] as ViewStyle;
    const variantStyle = styles[
      `${variant}Button` as keyof typeof styles
    ] as ViewStyle;

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...(disabled && styles.disabledButton),
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.buttonText;
    const sizeStyle = styles[
      `${size}ButtonText` as keyof typeof styles
    ] as TextStyle;
    const variantStyle = styles[
      `${variant}ButtonText` as keyof typeof styles
    ] as TextStyle;

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...(disabled && styles.disabledButtonText),
    };
  };

  // Simplified without LinearGradient for now

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#F9F7F4" : "#1F1F1F"}
        />
      ) : (
        <Text style={getTextStyle()}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gradientButton: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // Sizes
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },

  // Variants
  primaryButton: {
    backgroundColor: "#1F1F1F",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#D4CFC4",
  },
  ghostButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },

  // Disabled
  disabledButton: {
    opacity: 0.5,
  },

  // Text Styles
  buttonText: {
    fontWeight: "600",
  },
  smallButtonText: {
    fontSize: 13,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
  primaryButtonText: {
    color: "#F9F7F4",
  },
  secondaryButtonText: {
    color: "#1F1F1F",
  },
  ghostButtonText: {
    color: "#1F1F1F",
  },
  disabledButtonText: {
    opacity: 0.6,
  },
});

import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  Text,
  Animated,
} from "react-native";

interface GlassmorphicInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

/**
 * GlassmorphicInput - Luxury text input with focus glow
 *
 * Design: Blur background, serif placeholder, gold focus effect
 */
export default function GlassmorphicInput({
  label,
  error,
  icon,
  style,
  ...props
}: GlassmorphicInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useState(new Animated.Value(0))[0];

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(228, 223, 212, 1)", "rgba(218, 165, 32, 0.8)"],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15],
  });

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            shadowOpacity,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <TextInput
          {...props}
          style={[
            styles.input,
            icon ? styles.inputWithIcon : undefined,
            style,
          ]}
          placeholderTextColor="#B0AAA5"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Animated.View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#8B8680",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#B8860B",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  iconContainer: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F1F1F",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: "System",
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  error: {
    fontSize: 12,
    color: "#DC3545",
    marginTop: 6,
    marginLeft: 4,
  },
});

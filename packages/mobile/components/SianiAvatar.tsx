import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

interface SianiAvatarProps {
  size?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  onPress?: () => void;
  style?: any;
}

/**
 * SianiAvatar - The ever-present conversational companion
 *
 * Design Philosophy:
 * - Subtle luxury (not flashy, old money aesthetic)
 * - Always visible, never intrusive
 * - Gentle breathing animation to feel alive
 * - Glows when active (listening/speaking)
 * - Tactile feedback on interaction
 */
export default function SianiAvatar({
  size = 120,
  isListening = false,
  isSpeaking = false,
  onPress,
  style,
}: SianiAvatarProps) {
  // Animation values
  const breathAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Breathing animation (slow, calming)
  useEffect(() => {
    const breathAnimation = Animated.loop(
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
    );

    breathAnimation.start();
    return () => breathAnimation.stop();
  }, []);

  // Glow animation (subtle ambient light)
  useEffect(() => {
    const glowAnimation = Animated.loop(
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
    );

    glowAnimation.start();
    return () => glowAnimation.stop();
  }, []);

  // Active state animation (listening or speaking)
  useEffect(() => {
    if (isListening || isSpeaking) {
      // Faster pulse when active
      const activePulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      activePulse.start();
      return () => activePulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, isSpeaking]);

  const handlePress = () => {
    // Haptic feedback (subtle, elegant)
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  // Calculate glow color based on state
  const glowColor = isListening
    ? "rgba(218, 165, 32, 0.4)" // Gold when listening
    : isSpeaking
    ? "rgba(184, 134, 11, 0.5)" // Deeper gold when speaking
    : "rgba(255, 255, 255, 0.2)"; // Subtle white glow when idle

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
            backgroundColor: glowColor,
            opacity: glowOpacity,
            transform: [{ scale: breathAnim }],
          },
        ]}
      />

      {/* Active pulse ring (only when listening/speaking) */}
      {(isListening || isSpeaking) && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 60,
              height: size + 60,
              borderRadius: (size + 60) / 2,
              borderColor: isListening
                ? "rgba(218, 165, 32, 0.6)"
                : "rgba(184, 134, 11, 0.7)",
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Main avatar circle */}
      <Animated.View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: breathAnim }],
          },
        ]}
      >
        {/* Inner gradient effect */}
        <View style={styles.innerGradient} />

        {/* Center dot (Siani's essence) */}
        <View style={styles.centerDot} />

        {/* State indicator */}
        {isListening && (
          <View style={styles.listeningIndicator}>
            <View style={styles.waveBar} />
            <View style={[styles.waveBar, styles.waveBarMid]} />
            <View style={styles.waveBar} />
          </View>
        )}

        {isSpeaking && (
          <View style={styles.speakingIndicator}>
            <Animated.View
              style={[
                styles.speakingRing,
                { opacity: glowOpacity, transform: [{ scale: pulseAnim }] },
              ]}
            />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
  },
  avatar: {
    backgroundColor: "#1F1F1F", // Matte black
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  innerGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(218, 165, 32, 0.05)", // Subtle gold tint
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#DAA520", // Gold center
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  listeningIndicator: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waveBar: {
    width: 3,
    height: 16,
    backgroundColor: "#DAA520",
    borderRadius: 2,
  },
  waveBarMid: {
    height: 24,
  },
  speakingIndicator: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  speakingRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#DAA520",
  },
});

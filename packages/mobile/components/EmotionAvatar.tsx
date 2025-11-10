import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  useEmotionStore,
  EMOTION_COLORS,
  HAPTIC_PATTERNS,
  EmotionState,
} from "../store/emotionStore";

interface EmotionAvatarProps {
  size?: number;
  onPress?: () => void;
  floatingPosition?: "bottom-right" | "bottom-center" | "center";
}

/**
 * Emotion-Aware Siani Avatar
 *
 * Features:
 * - Floating circular avatar
 * - Emotion-based glow colors (calm, anxious, motivated)
 * - Haptic feedback patterns synced with emotion
 * - Pulse animation on voice activity
 * - Glassmorphic luxury design
 *
 * Design Philosophy:
 * - "Quietly luxurious, emotionally present"
 * - Not clinical - like a private concierge
 * - Subtle, not flashy
 */
export default function EmotionAvatar({
  size = 80,
  onPress,
  floatingPosition = "bottom-right",
}: EmotionAvatarProps) {
  const {
    currentEmotion,
    emotionIntensity,
    isListening,
    isSpeaking,
    shouldGlow,
    shouldHaptic,
    setGlow,
    setHaptic,
  } = useEmotionStore();

  // Animation values
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Get colors for current emotion
  const emotionColors = EMOTION_COLORS[currentEmotion];
  const hapticPattern = HAPTIC_PATTERNS[currentEmotion];

  // Glow animation (triggered by emotion changes)
  useEffect(() => {
    if (shouldGlow) {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: emotionIntensity,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: emotionIntensity * 0.3,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setGlow(false);
      });
    }
  }, [shouldGlow, emotionIntensity]);

  // Continuous pulse animation (when listening or speaking)
  useEffect(() => {
    if (isListening || isSpeaking) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, isSpeaking]);

  // Gentle rotation (breathing effect for calm state)
  useEffect(() => {
    if (currentEmotion === "calm" && !isListening && !isSpeaking) {
      const rotateAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      );
      rotateAnimation.start();

      return () => rotateAnimation.stop();
    }
  }, [currentEmotion, isListening, isSpeaking]);

  // Haptic feedback (emotion-synced patterns)
  useEffect(() => {
    if (shouldHaptic && Platform.OS !== "web") {
      const triggerHaptic = () => {
        const type = hapticPattern.type;
        switch (type) {
          case "impactLight":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case "impactMedium":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case "impactHeavy":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case "selectionChanged":
            Haptics.selectionAsync();
            break;
        }
      };

      triggerHaptic();
      const interval = setInterval(triggerHaptic, hapticPattern.interval);

      // Stop after 3 cycles
      setTimeout(() => {
        clearInterval(interval);
        setHaptic(false);
      }, hapticPattern.interval * 3);

      return () => clearInterval(interval);
    }
  }, [shouldHaptic, currentEmotion]);

  const handlePress = () => {
    // Trigger haptic feedback on press
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Trigger glow effect
    setGlow(true);

    onPress?.();
  };

  // Calculate glow opacity
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });

  // Calculate rotation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Position styles
  const positionStyle = getPositionStyle(floatingPosition, size);

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          transform: [
            { scale: pulseAnim },
            { rotate: currentEmotion === "calm" ? rotate : "0deg" },
          ],
        },
      ]}
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            backgroundColor: emotionColors.primary,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Middle ring (glassmorphic) */}
      <View
        style={[
          styles.glassRing,
          {
            width: size + 10,
            height: size + 10,
            borderRadius: (size + 10) / 2,
          },
        ]}
      />

      {/* Avatar button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {/* Inner gradient */}
        <Animated.View
          style={[
            styles.innerGradient,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: emotionColors.secondary,
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Center dot (Siani's core) */}
        <View style={styles.centerDot} />

        {/* State indicators */}
        {isListening && (
          <View style={styles.listeningIndicator}>
            <View style={[styles.soundWave, styles.wave1]} />
            <View style={[styles.soundWave, styles.wave2]} />
            <View style={[styles.soundWave, styles.wave3]} />
          </View>
        )}

        {isSpeaking && (
          <View style={styles.speakingIndicator}>
            <View style={[styles.speakingRing, styles.ring1]} />
            <View style={[styles.speakingRing, styles.ring2]} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function getPositionStyle(
  position: "bottom-right" | "bottom-center" | "center",
  size: number
): object {
  const margin = 24;

  switch (position) {
    case "bottom-right":
      return {
        position: "absolute",
        bottom: margin,
        right: margin,
      };
    case "bottom-center":
      return {
        position: "absolute",
        bottom: margin,
        alignSelf: "center",
      };
    case "center":
      return {
        alignSelf: "center",
        marginVertical: margin,
      };
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000, // Float above content
  },
  glowRing: {
    position: "absolute",
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  glassRing: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(10px)", // Glassmorphic effect
  },
  avatar: {
    backgroundColor: "rgba(31, 31, 31, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  innerGradient: {
    position: "absolute",
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DAA520",
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  listeningIndicator: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  soundWave: {
    width: 3,
    backgroundColor: "#DAA520",
    borderRadius: 2,
  },
  wave1: {
    height: 12,
  },
  wave2: {
    height: 20,
  },
  wave3: {
    height: 16,
  },
  speakingIndicator: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  speakingRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#DAA520",
    borderRadius: 999,
  },
  ring1: {
    width: 40,
    height: 40,
  },
  ring2: {
    width: 56,
    height: 56,
  },
});

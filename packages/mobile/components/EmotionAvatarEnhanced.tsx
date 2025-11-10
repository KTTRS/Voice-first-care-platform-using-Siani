import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useEmotionStore, EmotionState } from "../store/emotionStore";
import {
  GLOW_MAP,
  AVATAR_STATE_MAP,
  MICRO_ANIMATION_CONFIG,
  PRE_RESPONSE_DELAY_MS,
  hapticEventBus,
  type AvatarState,
} from "../utils/glowLogic";

interface EmotionAvatarEnhancedProps {
  size?: number;
  onPress?: () => void;
  floatingPosition?: "bottom-right" | "bottom-center" | "center";
  enableWearableSync?: boolean;
}

/**
 * Enhanced Emotion-Aware Siani Avatar
 *
 * Features:
 * - 4-state glow mapping (low/neutral/high/detached)
 * - Sine-wave opacity animations with continuous pulsing
 * - Micro-animations: breathing, leaning, flickering, tightening
 * - Pre-response delay (250-400ms) with glow tightening
 * - Advanced haptic feedback (Success, Medium, Selection)
 * - Voice-linked states: listening → processing → thinking → responding
 * - Optional haptic event bus for BLE wearables
 *
 * Design Philosophy:
 * - "Living companion" not "static button"
 * - Subtle presence animations
 * - Emotional resonance through haptic feedback
 * - Pre-response delays create anticipation
 */
export default function EmotionAvatarEnhanced({
  size = 80,
  onPress,
  floatingPosition = "bottom-right",
  enableWearableSync = false,
}: EmotionAvatarEnhancedProps) {
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

  // Avatar state machine
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [isThinking, setIsThinking] = useState(false);

  // Animation values
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Micro-animations
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const leanAnim = useRef(new Animated.Value(0)).current;
  const flickerAnim = useRef(new Animated.Value(1)).current;
  const tightenAnim = useRef(new Animated.Value(1)).current;

  // Sine-wave time counter
  const sineTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Get glow config for current emotion
  const glowConfig = GLOW_MAP[currentEmotion];
  const stateConfig = AVATAR_STATE_MAP[avatarState];

  // Update avatar state based on voice activity
  useEffect(() => {
    if (isListening) {
      setAvatarState("listening");
    } else if (isThinking) {
      setAvatarState("thinking");
    } else if (isSpeaking) {
      setAvatarState("responding");
    } else {
      setAvatarState("idle");
    }
  }, [isListening, isSpeaking, isThinking]);

  // Sine-wave glow animation (continuous)
  useEffect(() => {
    const animateSineWave = () => {
      sineTimeRef.current += 16; // ~60fps
      const phase =
        (sineTimeRef.current % glowConfig.pulseSpeed) / glowConfig.pulseSpeed;
      const sine = Math.sin(phase * 2 * Math.PI);
      const normalized = (sine + 1) / 2; // 0-1
      const opacity =
        glowConfig.intensity + (normalized - 0.5) * glowConfig.waveAmplitude;

      glowAnim.setValue(opacity);
      animationFrameRef.current = requestAnimationFrame(animateSineWave);
    };

    animationFrameRef.current = requestAnimationFrame(animateSineWave);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentEmotion, glowConfig]);

  // Continuous pulse animation (voice-linked)
  useEffect(() => {
    if (avatarState === "listening" || avatarState === "responding") {
      const pulseSpeed = stateConfig.pulseSpeed;
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: pulseSpeed / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: pulseSpeed / 2,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [avatarState, stateConfig.pulseSpeed]);

  // Micro-animation: Breathing (idle, listening)
  useEffect(() => {
    if (
      stateConfig.microAnimation === "breathe" &&
      avatarState !== "responding"
    ) {
      const breatheAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.03,
            duration: MICRO_ANIMATION_CONFIG.breathe.duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: MICRO_ANIMATION_CONFIG.breathe.duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      breatheAnimation.start();

      return () => breatheAnimation.stop();
    } else {
      breatheAnim.setValue(1);
    }
  }, [stateConfig.microAnimation, avatarState]);

  // Micro-animation: Leaning (responding)
  useEffect(() => {
    if (stateConfig.microAnimation === "lean") {
      const leanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(leanAnim, {
            toValue: 2,
            duration: MICRO_ANIMATION_CONFIG.lean.duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(leanAnim, {
            toValue: 0,
            duration: MICRO_ANIMATION_CONFIG.lean.duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      leanAnimation.start();

      return () => leanAnimation.stop();
    } else {
      leanAnim.setValue(0);
    }
  }, [stateConfig.microAnimation]);

  // Micro-animation: Flickering (processing)
  useEffect(() => {
    if (stateConfig.microAnimation === "flicker") {
      const flickerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(flickerAnim, {
            toValue: 0.85,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flickerAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flickerAnim, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flickerAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      );
      flickerAnimation.start();

      return () => flickerAnimation.stop();
    } else {
      flickerAnim.setValue(1);
    }
  }, [stateConfig.microAnimation]);

  // Micro-animation: Tightening (pre-response delay)
  useEffect(() => {
    if (stateConfig.microAnimation === "tighten") {
      Animated.sequence([
        Animated.timing(tightenAnim, {
          toValue: 0.97,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(tightenAnim, {
          toValue: 1.02,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      tightenAnim.setValue(1);
    }
  }, [stateConfig.microAnimation]);

  // Pre-response delay before speaking
  useEffect(() => {
    if (isSpeaking && !isThinking) {
      setIsThinking(true);

      const timeout = setTimeout(() => {
        setIsThinking(false);
      }, PRE_RESPONSE_DELAY_MS);

      return () => clearTimeout(timeout);
    }
  }, [isSpeaking]);

  // Advanced haptic feedback patterns
  useEffect(() => {
    if (shouldHaptic && Platform.OS !== "web") {
      const triggerHaptic = async () => {
        const pattern = stateConfig.hapticPattern;

        switch (pattern) {
          case "heartbeat":
            // Listening: light rhythmic heartbeat (every 1.5s)
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;

          case "shimmer":
            // Processing: subtle selection feedback
            await Haptics.selectionAsync();
            break;

          case "pulse":
            // Responding: medium impact on each word
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;

          case "none":
          default:
            return;
        }

        // Emit to wearable event bus
        if (enableWearableSync && pattern) {
          hapticEventBus.emit({
            type: pattern === "heartbeat" ? "heartbeat" : "pulse",
            intensity: stateConfig.glowIntensity,
            duration: 200,
            emotion: currentEmotion,
          });
        }
      };

      // Trigger haptic based on avatar state
      if (avatarState === "listening") {
        // Heartbeat pattern every 1.5s
        triggerHaptic();
        const interval = setInterval(triggerHaptic, 1500);
        return () => clearInterval(interval);
      } else if (avatarState === "responding") {
        // Single pulse at start of response
        triggerHaptic();
      } else if (avatarState === "processing") {
        // Shimmer at start
        triggerHaptic();
      }

      setHaptic(false);
    }
  }, [shouldHaptic, avatarState, enableWearableSync]);

  // Handle press with haptic feedback
  const handlePress = async () => {
    if (Platform.OS !== "web") {
      // Success haptic for high emotion, medium for others
      if (emotionIntensity >= 0.7) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    // Trigger glow effect
    setGlow(true);

    onPress?.();
  };

  // Calculate glow opacity (0.2 to 1)
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });

  // Calculate combined scale
  const combinedScale = Animated.multiply(
    Animated.multiply(pulseAnim, breatheAnim),
    tightenAnim
  );

  // Calculate lean rotation
  const leanRotate = leanAnim.interpolate({
    inputRange: [0, 2],
    outputRange: ["-2deg", "2deg"],
  });

  // Position styles
  const positionStyle = getPositionStyle(floatingPosition, size);

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          transform: [{ scale: combinedScale }, { rotate: leanRotate }],
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
            backgroundColor: glowConfig.color,
            opacity: Animated.multiply(glowOpacity, flickerAnim),
            shadowColor: glowConfig.color,
          },
        ]}
      />

      {/* Secondary glow ring */}
      <Animated.View
        style={[
          styles.secondaryGlow,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: glowConfig.secondaryColor,
            opacity: Animated.multiply(glowOpacity, 0.5),
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
              backgroundColor: glowConfig.secondaryColor,
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Center dot (Siani's core) */}
        <Animated.View
          style={[
            styles.centerDot,
            {
              backgroundColor: glowConfig.color,
              shadowColor: glowConfig.color,
              opacity: flickerAnim,
            },
          ]}
        />

        {/* State indicators */}
        {avatarState === "listening" && (
          <View style={styles.listeningIndicator}>
            <Animated.View
              style={[
                styles.soundWave,
                styles.wave1,
                { backgroundColor: glowConfig.color },
              ]}
            />
            <Animated.View
              style={[
                styles.soundWave,
                styles.wave2,
                { backgroundColor: glowConfig.color },
              ]}
            />
            <Animated.View
              style={[
                styles.soundWave,
                styles.wave3,
                { backgroundColor: glowConfig.color },
              ]}
            />
          </View>
        )}

        {avatarState === "responding" && (
          <View style={styles.speakingIndicator}>
            <Animated.View
              style={[
                styles.speakingRing,
                styles.ring1,
                {
                  borderColor: glowConfig.color,
                  opacity: flickerAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.speakingRing,
                styles.ring2,
                {
                  borderColor: glowConfig.color,
                  opacity: Animated.multiply(flickerAnim, 0.6),
                },
              ]}
            />
          </View>
        )}

        {avatarState === "processing" && (
          <View style={styles.processingIndicator}>
            <Animated.View
              style={[
                styles.shimmerDot,
                {
                  backgroundColor: glowConfig.color,
                  opacity: flickerAnim,
                },
              ]}
            />
          </View>
        )}

        {avatarState === "thinking" && (
          <View style={styles.thinkingIndicator}>
            <Animated.View
              style={[
                styles.thinkingRing,
                {
                  borderColor: glowConfig.color,
                  opacity: glowOpacity,
                  transform: [{ scale: tightenAnim }],
                },
              ]}
            />
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
    zIndex: 1000,
  },
  glowRing: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 20,
  },
  secondaryGlow: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 15,
  },
  glassRing: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatar: {
    backgroundColor: "rgba(31, 31, 31, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    overflow: "hidden",
  },
  innerGradient: {
    position: "absolute",
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
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
  processingIndicator: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  shimmerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  thinkingIndicator: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  thinkingRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
  },
});

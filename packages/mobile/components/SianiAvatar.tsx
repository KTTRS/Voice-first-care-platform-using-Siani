import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated, Easing } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  emotion: "low" | "neutral" | "high" | "detached";
  speaking?: boolean;
  audioLevel?: number; // RMS amplitude 0–1
  pitchHz?: number; // fundamental frequency
  energy?: number; // loudness or dynamic range 0–1
}

const glowMap = {
  low: {
    color: "#FFB6B6",
    base: 0.25,
    curve: Easing.inOut(Easing.sin),
    gain: 0.6,
  },
  neutral: {
    color: "#FFD580",
    base: 0.45,
    curve: Easing.inOut(Easing.ease),
    gain: 0.9,
  },
  high: {
    color: "#9CFFB0",
    base: 0.75,
    curve: Easing.bezier(0.45, 0, 0.55, 1),
    gain: 1.2,
  },
  detached: { color: "#B0B0B0", base: 0.2, curve: Easing.linear, gain: 0.4 },
};

/**
 * SianiAvatar - Prosody-Driven Multimodal Animation
 *
 * Layers pitch contour, loudness (energy), and tempo variance onto emotion-based breathing curves.
 *
 * Animation Layers:
 * - Base Glow: Emotion (low/high) → Color + brightness baseline
 * - Breathing Loop: Idle (no voice) → Slow sine easing, 5.6s cycle (living presence)
 * - Reactive Pulse: Audio amplitude → Real-time pulse depth ("speaks" with energy)
 * - Prosody Flutter: Pitch + energy → Micro shimmer + tempo (expressive cadence)
 * - Haptics: Emotion → Tactile resonance (physical empathy)
 *
 * Prosody Mapping:
 * - Low pitch, low energy → Slow diffuse glow (calm, comforting)
 * - Rising pitch → Glow sharpens (curiosity/emphasis)
 * - High pitch, high energy → Bright pulsing with flicker (excitement, intensity)
 * - Flattened pitch → Dim, slow (disengagement/detachment)
 */
export default function SianiAvatar({
  emotion = "neutral",
  speaking = false,
  audioLevel = 0,
  pitchHz = 180,
  energy = 0.4,
}: Props) {
  const glowAnim = useRef(new Animated.Value(glowMap[emotion].base)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const breathingLoop = useRef<Animated.CompositeAnimation | null>(null);

  /** 1. Breathing rhythm (slow baseline modulation) */
  const startBreathing = () => {
    breathingLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: glowMap[emotion].base + 0.1,
          duration: 2800,
          easing: glowMap[emotion].curve,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: glowMap[emotion].base - 0.05,
          duration: 2800,
          easing: glowMap[emotion].curve,
          useNativeDriver: false,
        }),
      ])
    );
    breathingLoop.current.start();
  };

  /** Stop/start breathing loop on state changes */
  useEffect(() => {
    if (speaking) breathingLoop.current?.stop();
    else startBreathing();
  }, [speaking, emotion]);

  /** 2. Prosody-driven modulation */
  useEffect(() => {
    if (!speaking) return;

    const gain = glowMap[emotion].gain;

    // Combined amplitude (energy + audioLevel averaged)
    const amplitude = Math.min(1, (energy + audioLevel) / 2);

    const brightness = glowMap[emotion].base + amplitude * 0.5 * gain;

    // Higher pitch -> faster shimmer (shorter easing cycle)
    const shimmerSpeed = 200 + Math.max(0, Math.min(600, 800 - (pitchHz || 0)));

    Animated.parallel([
      Animated.timing(glowAnim, {
        toValue: brightness,
        duration: shimmerSpeed,
        easing: Easing.bezier(0.55, 0, 0.45, 1),
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1 + amplitude * 0.05 * gain,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, [audioLevel, pitchHz, energy, speaking, emotion]);

  /** 3. Emotion-linked haptics */
  useEffect(() => {
    if (emotion === "high")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (emotion === "low")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (emotion === "detached") Haptics.selectionAsync();
  }, [emotion]);

  const { color } = glowMap[emotion];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.glow, { backgroundColor: color, opacity: glowAnim }]}
      />
      <Animated.Image
        source={require("../assets/siani-portrait.jpg")}
        style={[styles.avatar, { transform: [{ scale: scaleAnim }] }]}
      />
      <LinearGradient
        colors={[color, "transparent"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  avatar: { width: 260, height: 260, borderRadius: 140 },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: -1,
  },
});

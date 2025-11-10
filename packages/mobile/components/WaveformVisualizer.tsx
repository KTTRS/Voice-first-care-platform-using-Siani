import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

interface WaveformVisualizerProps {
  isActive: boolean;
  type: "listening" | "speaking";
}

/**
 * WaveformVisualizer - Visual audio feedback
 *
 * Shows animated waveforms when:
 * - listening: Gentle waves indicating microphone is active
 * - speaking: More pronounced waves showing Siani's voice output
 *
 * Design: Minimal, elegant, subtle luxury
 */
export default function WaveformVisualizer({
  isActive,
  type,
}: WaveformVisualizerProps) {
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.5)).current;
  const bar3 = useRef(new Animated.Value(0.7)).current;
  const bar4 = useRef(new Animated.Value(0.5)).current;
  const bar5 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      const createWave = (animValue: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: type === "speaking" ? 400 : 600,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: type === "speaking" ? 400 : 600,
              useNativeDriver: true,
            }),
          ])
        );

      const animations = [
        createWave(bar1, 0),
        createWave(bar2, 100),
        createWave(bar3, 200),
        createWave(bar4, 100),
        createWave(bar5, 0),
      ];

      animations.forEach((anim) => anim.start());

      return () => {
        animations.forEach((anim) => anim.stop());
      };
    } else {
      // Reset to idle state
      bar1.setValue(0.3);
      bar2.setValue(0.5);
      bar3.setValue(0.7);
      bar4.setValue(0.5);
      bar5.setValue(0.3);
    }
  }, [isActive, type]);

  const barColor =
    type === "listening"
      ? "rgba(218, 165, 32, 0.7)" // Gold for listening
      : "rgba(184, 134, 11, 0.8)"; // Deeper gold for speaking

  return (
    <View style={styles.container}>
      {isActive && (
        <View style={styles.waveformContainer}>
          <Animated.View
            style={[
              styles.bar,
              {
                backgroundColor: barColor,
                opacity: bar1,
                transform: [
                  {
                    scaleY: bar1.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              {
                backgroundColor: barColor,
                opacity: bar2,
                transform: [
                  {
                    scaleY: bar2.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              styles.centerBar,
              {
                backgroundColor: barColor,
                opacity: bar3,
                transform: [
                  {
                    scaleY: bar3.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.7, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              {
                backgroundColor: barColor,
                opacity: bar4,
                transform: [
                  {
                    scaleY: bar4.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              {
                backgroundColor: barColor,
                opacity: bar1,
                transform: [
                  {
                    scaleY: bar1.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      )}

      <Text style={styles.statusText}>
        {isActive
          ? type === "listening"
            ? "Listening..."
            : "Speaking..."
          : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  bar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  centerBar: {
    height: 56,
  },
  statusText: {
    fontSize: 13,
    color: "#6B6560",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

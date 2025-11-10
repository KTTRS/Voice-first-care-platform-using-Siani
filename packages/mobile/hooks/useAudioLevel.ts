import { Audio } from "expo-av";
import { useState, useEffect } from "react";

/**
 * useAudioLevel - Real-Time Audio Amplitude Hook
 *
 * Captures audio playback amplitude for TTS waveform synchronization.
 * Polls Audio.Sound status every 100ms to get current volume level.
 *
 * @param sound - Expo Audio.Sound instance (TTS playback)
 * @returns Normalized amplitude level (0-1)
 *
 * Usage:
 * ```tsx
 * const [sound, setSound] = useState<Audio.Sound | null>(null);
 * const audioLevel = useAudioLevel(sound);
 *
 * <SianiAvatar audioLevel={audioLevel} />
 * ```
 */
export function useAudioLevel(sound: Audio.Sound | null) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!sound) {
      setLevel(0);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const status = await sound.getStatusAsync();

        if (status.isLoaded && status.isPlaying) {
          // Normalize loudness (0–1 range)
          // Use volume and mute state to calculate amplitude
          const amplitude = (status.volume ?? 1) * (status.isMuted ? 0 : 1);
          setLevel(amplitude);
        } else {
          setLevel(0);
        }
      } catch (error) {
        console.warn("Error getting audio status:", error);
        setLevel(0);
      }
    }, 100); // Poll every 100ms (~10fps for smooth pulse)

    return () => clearInterval(interval);
  }, [sound]);

  return level;
}

/**
 * useAudioLevelFromStream - Alternative for custom TTS streams
 *
 * For non-Expo audio sources (e.g., WebRTC, custom audio streams),
 * this hook accepts amplitude values directly.
 *
 * @param amplitudeStream - Observable/EventEmitter providing amplitude
 * @returns Current amplitude level (0-1)
 */
export function useAudioLevelFromStream(
  amplitudeStream: {
    subscribe: (callback: (amplitude: number) => void) => () => void;
  } | null
) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!amplitudeStream) {
      setLevel(0);
      return;
    }

    const unsubscribe = amplitudeStream.subscribe((amplitude: number) => {
      // Clamp to 0-1 range
      setLevel(Math.max(0, Math.min(1, amplitude)));
    });

    return unsubscribe;
  }, [amplitudeStream]);

  return level;
}

/**
 * normalizeAudioGain - Map amplitude to animation range
 *
 * Converts raw audio amplitude (0-1) to a suitable range for animations.
 * Prevents overly subtle or exaggerated movements.
 *
 * @param amplitude - Raw amplitude (0-1)
 * @param minGain - Minimum animation multiplier (default: 0.3)
 * @param maxGain - Maximum animation multiplier (default: 1.0)
 * @returns Normalized gain value
 */
export function normalizeAudioGain(
  amplitude: number,
  minGain: number = 0.3,
  maxGain: number = 1.0
): number {
  return minGain + amplitude * (maxGain - minGain);
}

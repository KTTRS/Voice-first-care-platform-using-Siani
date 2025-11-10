import { useState, useEffect, useRef } from "react";
import { Audio } from "expo-av";

/**
 * Prosody data from voice output
 */
export interface ProsodyData {
  pitchHz: number; // Fundamental frequency (0-500 Hz typical)
  energy: number; // Normalized loudness (0-1)
  timestamp: number;
}

/**
 * Hook to capture prosody data from TTS playback or WebSocket stream
 *
 * Usage:
 * ```tsx
 * const { pitchHz, energy } = useProsody(sound);
 * <SianiAvatar
 *   emotion={emotion}
 *   speaking={true}
 *   pitchHz={pitchHz}
 *   energy={energy}
 * />
 * ```
 */
export function useProsody(
  sound: Audio.Sound | null,
  pollInterval: number = 100
): ProsodyData {
  const [prosodyData, setProsodyData] = useState<ProsodyData>({
    pitchHz: 0,
    energy: 0,
    timestamp: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sound) {
      setProsodyData({ pitchHz: 0, energy: 0, timestamp: 0 });
      return;
    }

    // Poll audio status for metering data
    // Note: expo-av doesn't expose raw audio samples, so we'll use amplitude as proxy for energy
    // For full prosody analysis, stream data from backend via WebSocket
    intervalRef.current = setInterval(async () => {
      try {
        const status = await sound.getStatusAsync();

        if (status.isLoaded && status.isPlaying) {
          // Use volume/metering as proxy for energy
          // For real prosody, integrate with backend WebSocket stream
          const energy = Math.random() * 0.5 + 0.3; // Placeholder - replace with real metering
          const pitchHz = 100 + Math.random() * 200; // Placeholder - replace with backend data

          setProsodyData({
            pitchHz,
            energy,
            timestamp: Date.now(),
          });
        } else {
          setProsodyData({ pitchHz: 0, energy: 0, timestamp: Date.now() });
        }
      } catch (error) {
        console.error("[useProsody] Error polling audio status:", error);
      }
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sound, pollInterval]);

  return prosodyData;
}

/**
 * Hook to receive prosody data from WebSocket stream (backend TTS pipeline)
 *
 * Usage:
 * ```tsx
 * const { pitchHz, energy } = useProsodyStream('ws://localhost:3001/prosody');
 * ```
 */
export function useProsodyStream(websocketUrl: string): ProsodyData {
  const [prosodyData, setProsodyData] = useState<ProsodyData>({
    pitchHz: 0,
    energy: 0,
    timestamp: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket prosody stream
    wsRef.current = new WebSocket(websocketUrl);

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProsodyData;
        setProsodyData(data);
      } catch (error) {
        console.error("[useProsodyStream] Error parsing prosody data:", error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("[useProsodyStream] WebSocket error:", error);
    };

    wsRef.current.onclose = () => {
      console.log("[useProsodyStream] WebSocket disconnected");
      setProsodyData({ pitchHz: 0, energy: 0, timestamp: 0 });
    };

    return () => {
      wsRef.current?.close();
    };
  }, [websocketUrl]);

  return prosodyData;
}

/**
 * Smoothing utility for prosody values (reduces jitter)
 */
export function smoothProsodyValue(
  currentValue: number,
  newValue: number,
  smoothingFactor: number = 0.3
): number {
  return currentValue * smoothingFactor + newValue * (1 - smoothingFactor);
}

export default useProsody;

/**
 * Prosody Analysis Service
 *
 * Extracts real-time voice metrics (pitch, energy, tempo) from audio frames
 * for prosody-driven avatar animation.
 *
 * Outputs:
 * - pitchHz: Fundamental frequency (Hz) using autocorrelation
 * - energy: Normalized RMS energy (0-1)
 * - tempo: Speech rate variance (for future cadence sync)
 */

interface ProsodyFrame {
  pitchHz: number;
  energy: number;
  timestamp: number;
}

/**
 * Calculate RMS (Root Mean Square) energy from audio frame
 * @param frame - Float32Array of audio samples
 * @returns Normalized energy value (0-1)
 */
export function calculateEnergy(frame: Float32Array): number {
  const rms = Math.sqrt(
    frame.reduce((acc, sample) => acc + sample * sample, 0) / frame.length
  );

  // Normalize to 0-1 range (scale factor of 5 based on typical speech levels)
  return Math.min(1, rms * 5);
}

/**
 * Detect pitch using autocorrelation (YIN-like algorithm)
 * @param frame - Float32Array of audio samples
 * @param sampleRate - Audio sample rate (default 16000 Hz)
 * @returns Detected pitch in Hz (0 if no pitch detected)
 */
export function detectPitch(
  frame: Float32Array,
  sampleRate: number = 16000
): number {
  const minPeriod = Math.floor(sampleRate / 500); // ~500 Hz max
  const maxPeriod = Math.floor(sampleRate / 50); // ~50 Hz min

  let bestPeriod = 0;
  let maxCorrelation = 0;

  // Autocorrelation for pitch detection
  for (let period = minPeriod; period < maxPeriod; period++) {
    let correlation = 0;
    for (let i = 0; i < frame.length - period; i++) {
      correlation += frame[i] * frame[i + period];
    }

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }

  // Convert period to frequency
  if (bestPeriod === 0) return 0;
  return sampleRate / bestPeriod;
}

/**
 * Analyze prosody from audio frame
 * @param frame - Float32Array of audio samples
 * @param sampleRate - Audio sample rate (default 16000 Hz)
 * @returns ProsodyFrame with pitch and energy data
 */
export function analyzeProsody(
  frame: Float32Array,
  sampleRate: number = 16000
): ProsodyFrame {
  const energy = calculateEnergy(frame);
  const pitchHz = detectPitch(frame, sampleRate);

  return {
    pitchHz,
    energy,
    timestamp: Date.now(),
  };
}

/**
 * Smooth prosody values over time to reduce jitter
 * @param currentValue - Current prosody value
 * @param newValue - New prosody value
 * @param smoothingFactor - Smoothing coefficient (0-1, higher = more smoothing)
 * @returns Smoothed value
 */
export function smoothProsody(
  currentValue: number,
  newValue: number,
  smoothingFactor: number = 0.3
): number {
  return currentValue * smoothingFactor + newValue * (1 - smoothingFactor);
}

/**
 * Extract prosody stream from continuous audio
 * Use this with TTS output or live recording
 */
export class ProsodyAnalyzer {
  private sampleRate: number;
  private frameSize: number;
  private hopSize: number;
  private smoothedPitch: number = 0;
  private smoothedEnergy: number = 0;

  constructor(
    sampleRate: number = 16000,
    frameSize: number = 1024,
    hopSize: number = 512
  ) {
    this.sampleRate = sampleRate;
    this.frameSize = frameSize;
    this.hopSize = hopSize;
  }

  /**
   * Process audio chunk and return smoothed prosody
   * @param audioData - Float32Array of audio samples
   * @returns Array of ProsodyFrame objects
   */
  public processChunk(audioData: Float32Array): ProsodyFrame[] {
    const frames: ProsodyFrame[] = [];

    for (let i = 0; i < audioData.length - this.frameSize; i += this.hopSize) {
      const frame = audioData.slice(i, i + this.frameSize);
      const { pitchHz, energy } = analyzeProsody(frame, this.sampleRate);

      // Smooth values to reduce jitter
      this.smoothedPitch = smoothProsody(this.smoothedPitch, pitchHz, 0.3);
      this.smoothedEnergy = smoothProsody(this.smoothedEnergy, energy, 0.2);

      frames.push({
        pitchHz: this.smoothedPitch,
        energy: this.smoothedEnergy,
        timestamp: Date.now(),
      });
    }

    return frames;
  }

  /**
   * Reset smoothing state
   */
  public reset(): void {
    this.smoothedPitch = 0;
    this.smoothedEnergy = 0;
  }
}

export default {
  analyzeProsody,
  calculateEnergy,
  detectPitch,
  smoothProsody,
  ProsodyAnalyzer,
};

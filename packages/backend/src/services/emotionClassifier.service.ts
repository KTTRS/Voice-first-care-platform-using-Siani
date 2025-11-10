/**
 * Emotion Classifier Service
 *
 * Maps voice and transcript data to emotional categories: Calm, Guarded, Lit
 * Outputs classification and modulation parameters for TTS and avatar animation
 */

export type EmotionCategory = "calm" | "guarded" | "lit";

export interface EmotionFeatures {
  transcript: string;
  pitch_contour?: number[]; // Array of pitch values per frame
  energy_curve?: number[]; // Normalized loudness values 0-1
  speech_rate?: number; // Words per second
  pause_durations?: number[]; // Array of pause lengths in ms
  prosody_summary?: string; // Format: "<mean_pitch>_<energy_mean>_<tempo>"
  lexical_tone_indicators?: string[]; // Keywords, emotion words, hedges
}

export interface ModulationParams {
  tts_pitch_shift: number; // Float pitch adjustment
  tts_speed_scale: number; // Speed multiplier
  glow_intensity: number; // 0-1 glow strength
  glow_easing_curve: "sine" | "ease-in" | "cubic";
}

export interface EmotionClassification {
  emotion_category: EmotionCategory;
  confidence: number; // 0-1
  modulation_params: ModulationParams;
}

class EmotionClassifierService {
  // Baseline thresholds for emotion classification
  private readonly CALM_THRESHOLDS = {
    pitch_min: 130,
    pitch_max: 170,
    energy_min: 0.25,
    energy_max: 0.45,
    speech_rate_min: 1.0,
    speech_rate_max: 1.4,
  };

  private readonly GUARDED_THRESHOLDS = {
    pitch_min: 160,
    pitch_max: 240,
    energy_min: 0.15,
    energy_max: 0.35,
    speech_rate_min: 0.7,
    speech_rate_max: 1.1,
  };

  private readonly LIT_THRESHOLDS = {
    pitch_min: 200,
    pitch_max: 300,
    energy_min: 0.6,
    energy_max: 1.0,
    speech_rate_min: 1.8,
    speech_rate_max: 2.5,
  };

  // Lexical indicators for each emotion category
  private readonly CALM_INDICATORS = [
    "yeah",
    "actually",
    "clear",
    "peaceful",
    "fine",
    "okay",
    "good",
    "helped",
    "walk",
    "breath",
    "calm",
    "steady",
  ];

  private readonly GUARDED_INDICATORS = [
    "i mean",
    "i guess",
    "maybe",
    "probably",
    "kind of",
    "sort of",
    "just",
    "tired",
    "whatever",
    "fine i guess",
    "i don't know",
    "uncertain",
    "worried",
  ];

  private readonly LIT_INDICATORS = [
    "let's do it",
    "absolutely",
    "amazing",
    "excited",
    "can't wait",
    "love",
    "yes",
    "totally",
    "definitely",
    "pumped",
    "ready",
    "bring it",
    "passionate",
    "fired up",
  ];

  /**
   * Classify emotion from voice and text features
   */
  async classifyEmotion(
    features: EmotionFeatures
  ): Promise<EmotionClassification> {
    // Extract acoustic features
    const meanPitch = this.calculateMeanPitch(features.pitch_contour);
    const meanEnergy = this.calculateMeanEnergy(features.energy_curve);
    const speechRate =
      features.speech_rate || this.estimateSpeechRate(features.transcript);
    const pitchVariability = this.calculatePitchVariability(
      features.pitch_contour
    );
    const pauseFrequency = this.analyzePausePattern(features.pause_durations);

    // Extract lexical features
    const lexicalScores = this.analyzeLexicalTone(features.transcript);

    // Score each emotion category
    const calmScore = this.scoreCalmness(
      meanPitch,
      meanEnergy,
      speechRate,
      pitchVariability,
      lexicalScores.calm
    );

    const guardedScore = this.scoreGuardedness(
      meanPitch,
      meanEnergy,
      speechRate,
      pauseFrequency,
      lexicalScores.guarded
    );

    const litScore = this.scoreLitness(
      meanPitch,
      meanEnergy,
      speechRate,
      pitchVariability,
      lexicalScores.lit
    );

    // Determine primary emotion
    const scores = { calm: calmScore, guarded: guardedScore, lit: litScore };
    const primaryEmotion = this.selectPrimaryEmotion(scores);
    const confidence = this.calculateConfidence(scores, primaryEmotion);

    // Generate modulation parameters
    const modulationParams = this.generateModulationParams(
      primaryEmotion,
      meanPitch,
      meanEnergy,
      speechRate
    );

    return {
      emotion_category: primaryEmotion,
      confidence,
      modulation_params: modulationParams,
    };
  }

  /**
   * Calculate mean pitch from pitch contour
   */
  private calculateMeanPitch(pitch_contour?: number[]): number {
    if (!pitch_contour || pitch_contour.length === 0) {
      return 180; // Default neutral pitch
    }
    const sum = pitch_contour.reduce((acc, val) => acc + val, 0);
    return sum / pitch_contour.length;
  }

  /**
   * Calculate mean energy from energy curve
   */
  private calculateMeanEnergy(energy_curve?: number[]): number {
    if (!energy_curve || energy_curve.length === 0) {
      return 0.4; // Default neutral energy
    }
    const sum = energy_curve.reduce((acc, val) => acc + val, 0);
    return sum / energy_curve.length;
  }

  /**
   * Estimate speech rate from transcript (words per second)
   */
  private estimateSpeechRate(transcript: string): number {
    const words = transcript.trim().split(/\s+/).length;
    // Assume average utterance is 5 seconds if no timing info
    return words / 5.0;
  }

  /**
   * Calculate pitch variability (standard deviation)
   */
  private calculatePitchVariability(pitch_contour?: number[]): number {
    if (!pitch_contour || pitch_contour.length < 2) {
      return 20; // Default moderate variability
    }

    const mean = this.calculateMeanPitch(pitch_contour);
    const variance =
      pitch_contour.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      pitch_contour.length;
    return Math.sqrt(variance);
  }

  /**
   * Analyze pause pattern (frequency and duration)
   */
  private analyzePausePattern(pause_durations?: number[]): number {
    if (!pause_durations || pause_durations.length === 0) {
      return 0.5; // Default moderate pausing
    }

    // High pause frequency and long durations indicate guardedness
    const avgPauseDuration =
      pause_durations.reduce((acc, val) => acc + val, 0) /
      pause_durations.length;
    const pauseFrequency = pause_durations.length;

    // Normalize to 0-1 (higher = more pauses/longer pauses)
    return Math.min(1, (pauseFrequency * avgPauseDuration) / 1000);
  }

  /**
   * Analyze lexical tone indicators
   */
  private analyzeLexicalTone(transcript: string): {
    calm: number;
    guarded: number;
    lit: number;
  } {
    const lowerTranscript = transcript.toLowerCase();

    const calmMatches = this.CALM_INDICATORS.filter((word) =>
      lowerTranscript.includes(word)
    ).length;

    const guardedMatches = this.GUARDED_INDICATORS.filter((word) =>
      lowerTranscript.includes(word)
    ).length;

    const litMatches = this.LIT_INDICATORS.filter((word) =>
      lowerTranscript.includes(word)
    ).length;

    return {
      calm: calmMatches,
      guarded: guardedMatches,
      lit: litMatches,
    };
  }

  /**
   * Score calmness (0-1)
   */
  private scoreCalmness(
    pitch: number,
    energy: number,
    speechRate: number,
    pitchVariability: number,
    lexicalScore: number
  ): number {
    let score = 0;

    // Pitch in calm range
    if (
      pitch >= this.CALM_THRESHOLDS.pitch_min &&
      pitch <= this.CALM_THRESHOLDS.pitch_max
    ) {
      score += 0.3;
    }

    // Energy in calm range
    if (
      energy >= this.CALM_THRESHOLDS.energy_min &&
      energy <= this.CALM_THRESHOLDS.energy_max
    ) {
      score += 0.2;
    }

    // Speech rate in calm range
    if (
      speechRate >= this.CALM_THRESHOLDS.speech_rate_min &&
      speechRate <= this.CALM_THRESHOLDS.speech_rate_max
    ) {
      score += 0.2;
    }

    // Low pitch variability (steady voice)
    if (pitchVariability < 30) {
      score += 0.15;
    }

    // Lexical indicators
    score += Math.min(0.15, lexicalScore * 0.05);

    return Math.min(1, score);
  }

  /**
   * Score guardedness (0-1)
   */
  private scoreGuardedness(
    pitch: number,
    energy: number,
    speechRate: number,
    pauseFrequency: number,
    lexicalScore: number
  ): number {
    let score = 0;

    // Pitch in guarded range (often higher due to tension)
    if (
      pitch >= this.GUARDED_THRESHOLDS.pitch_min &&
      pitch <= this.GUARDED_THRESHOLDS.pitch_max
    ) {
      score += 0.25;
    }

    // Low energy (withdrawn)
    if (
      energy >= this.GUARDED_THRESHOLDS.energy_min &&
      energy <= this.GUARDED_THRESHOLDS.energy_max
    ) {
      score += 0.25;
    }

    // Slow speech rate (hesitant)
    if (
      speechRate >= this.GUARDED_THRESHOLDS.speech_rate_min &&
      speechRate <= this.GUARDED_THRESHOLDS.speech_rate_max
    ) {
      score += 0.2;
    }

    // Frequent pauses (uncertainty)
    if (pauseFrequency > 0.6) {
      score += 0.15;
    }

    // Lexical indicators (hedging, uncertainty)
    score += Math.min(0.15, lexicalScore * 0.05);

    return Math.min(1, score);
  }

  /**
   * Score litness (0-1)
   */
  private scoreLitness(
    pitch: number,
    energy: number,
    speechRate: number,
    pitchVariability: number,
    lexicalScore: number
  ): number {
    let score = 0;

    // High pitch (excitement)
    if (
      pitch >= this.LIT_THRESHOLDS.pitch_min &&
      pitch <= this.LIT_THRESHOLDS.pitch_max
    ) {
      score += 0.3;
    }

    // High energy (passionate)
    if (
      energy >= this.LIT_THRESHOLDS.energy_min &&
      energy <= this.LIT_THRESHOLDS.energy_max
    ) {
      score += 0.25;
    }

    // Fast speech rate (energetic)
    if (
      speechRate >= this.LIT_THRESHOLDS.speech_rate_min &&
      speechRate <= this.LIT_THRESHOLDS.speech_rate_max
    ) {
      score += 0.2;
    }

    // High pitch variability (dynamic, expressive)
    if (pitchVariability > 40) {
      score += 0.1;
    }

    // Lexical indicators (enthusiasm)
    score += Math.min(0.15, lexicalScore * 0.05);

    return Math.min(1, score);
  }

  /**
   * Select primary emotion from scores
   */
  private selectPrimaryEmotion(scores: {
    calm: number;
    guarded: number;
    lit: number;
  }): EmotionCategory {
    const maxScore = Math.max(scores.calm, scores.guarded, scores.lit);

    if (scores.calm === maxScore) return "calm";
    if (scores.guarded === maxScore) return "guarded";
    return "lit";
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    scores: { calm: number; guarded: number; lit: number },
    primaryEmotion: EmotionCategory
  ): number {
    const primaryScore = scores[primaryEmotion];
    const otherScores = Object.entries(scores)
      .filter(([key]) => key !== primaryEmotion)
      .map(([, value]) => value);

    const maxOtherScore = Math.max(...otherScores);

    // Confidence is the gap between primary and next-best emotion
    const gap = primaryScore - maxOtherScore;

    // Normalize to 0-1 (higher gap = higher confidence)
    return Math.min(1, Math.max(0.5, 0.5 + gap));
  }

  /**
   * Generate modulation parameters for TTS and avatar
   */
  private generateModulationParams(
    emotion: EmotionCategory,
    meanPitch: number,
    meanEnergy: number,
    speechRate: number
  ): ModulationParams {
    switch (emotion) {
      case "calm":
        return {
          tts_pitch_shift: -0.02 + (meanPitch - 145) * 0.0001,
          tts_speed_scale: 0.95,
          glow_intensity: 0.4,
          glow_easing_curve: "sine",
        };

      case "guarded":
        return {
          tts_pitch_shift: 0.03 + (meanPitch - 200) * 0.00008,
          tts_speed_scale: 0.85,
          glow_intensity: 0.25,
          glow_easing_curve: "ease-in",
        };

      case "lit":
        return {
          tts_pitch_shift: 0.08 + (meanPitch - 250) * 0.0001,
          tts_speed_scale: 1.15,
          glow_intensity: 0.9,
          glow_easing_curve: "cubic",
        };
    }
  }

  /**
   * Batch classify multiple utterances
   */
  async classifyBatch(
    featuresArray: EmotionFeatures[]
  ): Promise<EmotionClassification[]> {
    return Promise.all(featuresArray.map((f) => this.classifyEmotion(f)));
  }
}

export const emotionClassifierService = new EmotionClassifierService();

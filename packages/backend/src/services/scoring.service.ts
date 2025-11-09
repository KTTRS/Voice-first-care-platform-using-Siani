import { SignalType, SignalSeverity } from '@prisma/client';

interface SignalData {
  type: SignalType;
  value: string;
  metadata?: any;
}

interface ScoringWeights {
  [key: string]: {
    base: number;
    severityMultiplier: {
      [key in SignalSeverity]: number;
    };
  };
}

class SignalScoringEngine {
  private weights: ScoringWeights = {
    VITAL_SIGN: {
      base: 50,
      severityMultiplier: {
        LOW: 1.0,
        MEDIUM: 1.5,
        HIGH: 2.0,
        CRITICAL: 3.0,
      },
    },
    SYMPTOM: {
      base: 40,
      severityMultiplier: {
        LOW: 1.0,
        MEDIUM: 1.8,
        HIGH: 2.5,
        CRITICAL: 3.5,
      },
    },
    MEDICATION: {
      base: 30,
      severityMultiplier: {
        LOW: 1.0,
        MEDIUM: 1.3,
        HIGH: 1.8,
        CRITICAL: 2.5,
      },
    },
    MOOD: {
      base: 25,
      severityMultiplier: {
        LOW: 1.0,
        MEDIUM: 1.4,
        HIGH: 2.0,
        CRITICAL: 2.8,
      },
    },
    ACTIVITY: {
      base: 20,
      severityMultiplier: {
        LOW: 1.0,
        MEDIUM: 1.2,
        HIGH: 1.5,
        CRITICAL: 2.0,
      },
    },
  };

  calculateScore(signal: SignalData, severity: SignalSeverity): number {
    const typeWeight = this.weights[signal.type];
    if (!typeWeight) {
      return 0;
    }

    const baseScore = typeWeight.base;
    const multiplier = typeWeight.severityMultiplier[severity];

    // Apply metadata-based adjustments
    let metadataAdjustment = 1.0;
    if (signal.metadata) {
      if (signal.metadata.urgent) metadataAdjustment *= 1.5;
      if (signal.metadata.recurring) metadataAdjustment *= 1.3;
      if (signal.metadata.patientReported) metadataAdjustment *= 1.1;
    }

    const score = baseScore * multiplier * metadataAdjustment;
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.round(score));
  }

  determineSeverity(signal: SignalData): SignalSeverity {
    // This is a simplified severity determination
    // In production, this would use ML models or more complex rules
    
    if (signal.type === 'VITAL_SIGN') {
      return this.assessVitalSignSeverity(signal);
    } else if (signal.type === 'SYMPTOM') {
      return this.assessSymptomSeverity(signal);
    }

    // Default severity assessment
    if (signal.metadata?.severity) {
      return signal.metadata.severity as SignalSeverity;
    }

    return 'LOW';
  }

  private assessVitalSignSeverity(signal: SignalData): SignalSeverity {
    const value = parseFloat(signal.value);
    const metadata = signal.metadata || {};

    // Example: Heart rate assessment
    if (metadata.vitalType === 'heartRate') {
      if (value < 40 || value > 120) return 'CRITICAL';
      if (value < 50 || value > 100) return 'HIGH';
      if (value < 60 || value > 90) return 'MEDIUM';
      return 'LOW';
    }

    // Example: Temperature assessment
    if (metadata.vitalType === 'temperature') {
      if (value > 39.5 || value < 35) return 'CRITICAL';
      if (value > 38.5 || value < 35.5) return 'HIGH';
      if (value > 37.5 || value < 36) return 'MEDIUM';
      return 'LOW';
    }

    return 'MEDIUM';
  }

  private assessSymptomSeverity(signal: SignalData): SignalSeverity {
    const keywords = signal.value.toLowerCase();
    const metadata = signal.metadata || {};

    // Critical keywords
    if (keywords.includes('severe') || keywords.includes('extreme') || 
        keywords.includes('unbearable') || keywords.includes('emergency')) {
      return 'CRITICAL';
    }

    // High severity keywords
    if (keywords.includes('intense') || keywords.includes('significant') || 
        keywords.includes('worsening')) {
      return 'HIGH';
    }

    // Medium severity
    if (keywords.includes('moderate') || keywords.includes('noticeable')) {
      return 'MEDIUM';
    }

    // Pain scale assessment
    if (metadata.painScale !== undefined) {
      const painScore = parseInt(metadata.painScale);
      if (painScore >= 8) return 'CRITICAL';
      if (painScore >= 6) return 'HIGH';
      if (painScore >= 4) return 'MEDIUM';
      return 'LOW';
    }

    return 'LOW';
  }

  getScoreInterpretation(score: number): string {
    if (score >= 80) return 'Immediate attention required';
    if (score >= 60) return 'High priority - review soon';
    if (score >= 40) return 'Monitor closely';
    if (score >= 20) return 'Routine monitoring';
    return 'Low priority';
  }
}

export const signalScoringEngine = new SignalScoringEngine();

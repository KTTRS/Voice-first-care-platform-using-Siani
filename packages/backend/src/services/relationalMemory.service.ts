/**
 * Relational Memory Service
 *
 * Vector-based knowledge layer that stores conversation embeddings with emotional context
 * Enables long-term relationship memory and contextual recall
 */

import prisma from "../utils/db";
import { embeddingService } from "./embedding.service";
import { vectorDBService } from "./vectordb.service";
import {
  prosodyEmbeddingService,
  ProsodyData,
} from "./prosodyEmbedding.service";
import { EmotionLevel } from "../utils/emotionAnalysis";

export interface ConversationMemory {
  userId: string;
  content: string;
  transcript: string;
  emotion: EmotionLevel;
  emotionVector: number[]; // [calm, guarded, lit]
  topics: string[];
  timestamp: Date;
}

export interface StoredMemory {
  id: string;
  userId: string;
  content: string;
  emotionVector: string;
  topics: string;
  embedding: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryWithSimilarity extends StoredMemory {
  emotionSimilarity: number;
}

export interface RelationalContext {
  userId: string;
  topics: string[];
  emotionVectorMean: number[]; // Average emotional state
  trustIndex: number; // 0-1: frequency of emotionally open moments
  resonanceIndex: number; // 0-1: emotional convergence with Siani
  continuityScore: number; // 0-1: emotional/topical overlap between sessions
  lastUpdate: Date;
}

export interface MemoryRetrievalResult {
  memories: any[];
  emotionalContext: {
    dominantEmotion: EmotionLevel;
    emotionVector: number[];
    similarMoods: number;
  };
  relationalCues: {
    trustLevel: number;
    familiarity: number;
    continuity: number;
  };
  contextPrompt: string;
}

class RelationalMemoryService {
  /**
   * Store conversation with emotional context in relational memory graph
   */
  async storeConversation(
    userId: string,
    transcript: string,
    emotion: EmotionLevel,
    emotionVector: number[], // [calm, guarded, lit]
    topics: string[],
    prosodyData?: ProsodyData
  ): Promise<void> {
    try {
      // Generate combined text + emotion embedding
      const textEmbedding = await embeddingService.createEmbedding(transcript);

      let combinedEmbedding = textEmbedding;
      let emotionIntensity = 0.5;

      if (prosodyData) {
        const prosodyEmbedding =
          prosodyEmbeddingService.generateProsodyEmbedding(prosodyData);
        combinedEmbedding = prosodyEmbeddingService.combinedEmbedding(
          textEmbedding,
          prosodyEmbedding
        );
        emotionIntensity = prosodyEmbedding.emotionIntensity;
      }

      // Store in relational memory table
      const memory = await prisma.relationalMemory.create({
        data: {
          userId,
          content: transcript,
          emotionVector: JSON.stringify(emotionVector),
          topics: JSON.stringify(topics),
          embedding: JSON.stringify(combinedEmbedding),
        },
      });

      // Update user's relational context
      await this.updateRelationalContext(
        userId,
        emotion,
        emotionVector,
        topics
      );

      console.log(
        `✅ Stored relational memory for user ${userId}: ${emotion} (${topics.join(
          ", "
        )})`
      );
    } catch (error) {
      console.error("Failed to store relational memory:", error);
      throw error;
    }
  }

  /**
   * Update user's relational context (trust, resonance, continuity)
   */
  private async updateRelationalContext(
    userId: string,
    emotion: EmotionLevel,
    emotionVector: number[],
    topics: string[]
  ): Promise<void> {
    // Get existing context or create new
    let context = await prisma.relationalContext.findUnique({
      where: { userId },
    });

    if (!context) {
      // Create initial context
      context = await prisma.relationalContext.create({
        data: {
          userId,
          topics: JSON.stringify(topics),
          emotionVectorMean: JSON.stringify(emotionVector),
          trustIndex: 0.5,
          resonanceIndex: 0.5,
          continuityScore: 0.5,
        },
      });
    } else {
      // Update existing context
      const existingTopics = JSON.parse(context.topics as string) as string[];
      const newTopics = [...new Set([...existingTopics, ...topics])]; // Merge unique topics

      const existingEmotionVector = JSON.parse(
        context.emotionVectorMean as string
      ) as number[];

      // Compute running average of emotion vectors
      const alpha = 0.2; // Smoothing factor
      const updatedEmotionVector = existingEmotionVector.map(
        (val, idx) => val * (1 - alpha) + emotionVector[idx] * alpha
      );

      // Update trust index (increases with emotionally open moments)
      const trustBoost = this.computeTrustBoost(emotion, emotionVector);
      const updatedTrustIndex = Math.min(
        1,
        context.trustIndex + trustBoost * 0.05
      );

      // Update continuity score (based on topic overlap)
      const topicOverlap =
        topics.filter((t) => existingTopics.includes(t)).length / topics.length;
      const updatedContinuityScore =
        context.continuityScore * 0.8 + topicOverlap * 0.2;

      await prisma.relationalContext.update({
        where: { userId },
        data: {
          topics: JSON.stringify(newTopics),
          emotionVectorMean: JSON.stringify(updatedEmotionVector),
          trustIndex: updatedTrustIndex,
          continuityScore: updatedContinuityScore,
        },
      });
    }
  }

  /**
   * Compute trust boost based on emotional openness
   */
  private computeTrustBoost(
    emotion: EmotionLevel,
    emotionVector: number[]
  ): number {
    // Higher trust boost for vulnerable emotions (guarded, low, anxious)
    const vulnerabilityMap: Record<EmotionLevel, number> = {
      low: 0.8, // Sharing sadness = high trust
      anxious: 0.7,
      guarded: 0.6,
      neutral: 0.3,
      calm: 0.5,
      high: 0.4,
      detached: 0.2, // Detachment = low trust
      lit: 0.5, // Elevated positive energy
    };

    return vulnerabilityMap[emotion] || 0.3;
  }

  /**
   * Retrieve relevant memories and relational context for conversation
   */
  async retrieveContext(
    userId: string,
    currentTranscript: string,
    currentEmotion: EmotionLevel,
    currentEmotionVector: number[],
    limit: number = 5
  ): Promise<MemoryRetrievalResult> {
    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.createEmbedding(
        currentTranscript
      );

      // Retrieve relational context
      const context = await prisma.relationalContext.findUnique({
        where: { userId },
      });

      if (!context) {
        return {
          memories: [],
          emotionalContext: {
            dominantEmotion: currentEmotion,
            emotionVector: currentEmotionVector,
            similarMoods: 0,
          },
          relationalCues: {
            trustLevel: 0.5,
            familiarity: 0.5,
            continuity: 0.5,
          },
          contextPrompt: "This is a new conversation with no prior context.",
        };
      }

      // Retrieve similar memories from database
      const memories = await prisma.relationalMemory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit * 2, // Get more for filtering
      });

      // Compute emotional similarity for each memory
      const memoriesWithSimilarity: MemoryWithSimilarity[] = memories.map(
        (mem: StoredMemory) => {
          const memEmotionVector = JSON.parse(mem.emotionVector as string);
          const similarity = this.computeEmotionSimilarity(
            currentEmotionVector,
            memEmotionVector
          );
          return { ...mem, emotionSimilarity: similarity };
        }
      );

      // Filter by emotional similarity threshold (cosine distance < 0.25)
      const similarMemories = memoriesWithSimilarity
        .filter((m: MemoryWithSimilarity) => m.emotionSimilarity > 0.75) // Cosine similarity > 0.75
        .sort(
          (a: MemoryWithSimilarity, b: MemoryWithSimilarity) =>
            b.emotionSimilarity - a.emotionSimilarity
        )
        .slice(0, limit);

      // Compute dominant emotion from context
      const emotionVectorMean = JSON.parse(
        context.emotionVectorMean as string
      ) as number[];
      const dominantEmotion = this.getDominantEmotion(emotionVectorMean);

      // Generate context prompt for LLM
      const contextPrompt = this.generateContextPrompt(
        similarMemories,
        context,
        currentEmotion
      );

      return {
        memories: similarMemories,
        emotionalContext: {
          dominantEmotion,
          emotionVector: emotionVectorMean,
          similarMoods: similarMemories.length,
        },
        relationalCues: {
          trustLevel: context.trustIndex,
          familiarity: this.computeFamiliarity(memories.length),
          continuity: context.continuityScore,
        },
        contextPrompt,
      };
    } catch (error) {
      console.error("Failed to retrieve relational context:", error);
      throw error;
    }
  }

  /**
   * Compute cosine similarity between emotion vectors
   */
  private computeEmotionSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Get dominant emotion from emotion vector
   */
  private getDominantEmotion(emotionVector: number[]): EmotionLevel {
    const [calm, guarded, lit] = emotionVector;

    if (calm > guarded && calm > lit) return "calm";
    if (guarded > calm && guarded > lit) return "guarded";
    if (lit > calm && lit > guarded) return "high";

    return "neutral";
  }

  /**
   * Compute familiarity based on conversation count
   */
  private computeFamiliarity(conversationCount: number): number {
    // Logarithmic familiarity growth
    return Math.min(1, Math.log10(conversationCount + 1) / 2);
  }

  /**
   * Generate context prompt for LLM with relational memory
   */
  private generateContextPrompt(
    memories: any[],
    context: any,
    currentEmotion: EmotionLevel
  ): string {
    if (memories.length === 0) {
      return `This user is new. Trust level: ${(
        context.trustIndex * 100
      ).toFixed(0)}%. Approach with warmth and patience.`;
    }

    const topics = JSON.parse(context.topics as string);
    const emotionVectorMean = JSON.parse(context.emotionVectorMean as string);
    const [calm, guarded, lit] = emotionVectorMean;

    let prompt = `Relational Context for this user:\n\n`;

    prompt += `Trust Level: ${(context.trustIndex * 100).toFixed(0)}% (${
      context.trustIndex > 0.7
        ? "high trust"
        : context.trustIndex > 0.4
        ? "building trust"
        : "early trust"
    })\n`;
    prompt += `Familiarity: ${(
      this.computeFamiliarity(memories.length) * 100
    ).toFixed(0)}%\n`;
    prompt += `Continuity: ${(context.continuityScore * 100).toFixed(
      0
    )}% (topical consistency)\n\n`;

    prompt += `Emotional Profile:\n`;
    prompt += `- Calm moments: ${(calm * 100).toFixed(0)}%\n`;
    prompt += `- Guarded moments: ${(guarded * 100).toFixed(0)}%\n`;
    prompt += `- Energized moments: ${(lit * 100).toFixed(0)}%\n\n`;

    prompt += `Recurring Topics: ${topics.slice(0, 5).join(", ")}\n\n`;

    prompt += `Similar Past Moments (when they felt ${currentEmotion}):\n`;
    memories.slice(0, 3).forEach((mem, idx) => {
      const memTopics = JSON.parse(mem.topics as string);
      prompt += `${idx + 1}. "${mem.content.slice(0, 100)}..." (${
        mem.emotion
      }, topics: ${memTopics.join(", ")})\n`;
    });

    prompt += `\nGuidance: In past similar moods, the user reflected on these topics and needed ${
      guarded > 0.5
        ? "calm, supportive pacing"
        : lit > 0.5
        ? "energetic, affirming responses"
        : "balanced, steady dialogue"
    }. Continue in that relational tone.`;

    return prompt;
  }

  /**
   * Update resonance index when Siani's response mirrors user emotion
   */
  async updateResonance(
    userId: string,
    userEmotion: EmotionLevel,
    sianiEmotion: EmotionLevel
  ): Promise<void> {
    const context = await prisma.relationalContext.findUnique({
      where: { userId },
    });

    if (!context) return;

    // Compute resonance (1 if emotions match, 0 if completely different)
    const resonance = userEmotion === sianiEmotion ? 1 : 0.5;

    // Update resonance index with smoothing
    const updatedResonanceIndex =
      context.resonanceIndex * 0.9 + resonance * 0.1;

    await prisma.relationalContext.update({
      where: { userId },
      data: { resonanceIndex: updatedResonanceIndex },
    });
  }

  /**
   * Get relational metrics for user (for dashboards/clinicians)
   */
  async getRelationalMetrics(userId: string): Promise<{
    trustIndex: number;
    resonanceIndex: number;
    continuityScore: number;
    conversationCount: number;
    emotionalProfile: {
      calm: number;
      guarded: number;
      lit: number;
    };
    topics: string[];
  } | null> {
    const context = await prisma.relationalContext.findUnique({
      where: { userId },
    });

    if (!context) return null;

    const memories = await prisma.relationalMemory.findMany({
      where: { userId },
    });

    const topics = JSON.parse(context.topics as string);
    const emotionVector = JSON.parse(context.emotionVectorMean as string);

    return {
      trustIndex: context.trustIndex,
      resonanceIndex: context.resonanceIndex,
      continuityScore: context.continuityScore,
      conversationCount: memories.length,
      emotionalProfile: {
        calm: emotionVector[0],
        guarded: emotionVector[1],
        lit: emotionVector[2],
      },
      topics,
    };
  }
}

export const relationalMemoryService = new RelationalMemoryService();

import { MemoryMoment, Prisma } from "@prisma/client";
import prisma from "../utils/db";
import { embeddingService } from "./embedding.service";
import { vectorDBService } from "./vectordb.service";
import {
  prosodyEmbeddingService,
  ProsodyData,
} from "./prosodyEmbedding.service";
import { EmotionLevel } from "../utils/emotionAnalysis";

export async function listMemoryMoments(params?: {
  skip?: number;
  take?: number;
}): Promise<MemoryMoment[]> {
  const { skip, take } = params || {};
  return prisma.memoryMoment.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });
}

export async function getMemoryMomentById(
  id: string
): Promise<MemoryMoment | null> {
  return prisma.memoryMoment.findUnique({ where: { id } });
}

export async function createMemoryMoment(
  data: Prisma.MemoryMomentUncheckedCreateInput,
  prosodyData?: ProsodyData
): Promise<MemoryMoment> {
  // Create the memory moment in the database
  const memoryMoment = await prisma.memoryMoment.create({ data });

  // Generate combined embedding (text + prosody) and store in vector database
  try {
    // Generate text embedding (1536 dimensions from OpenAI)
    const textEmbedding = await embeddingService.createEmbedding(
      memoryMoment.content
    );

    // Generate prosody embedding if prosody data provided
    let combinedEmbedding = textEmbedding;
    let emotionIntensity = 0.5; // Default neutral
    let retentionTTL = 30; // Default 30 days

    if (prosodyData) {
      const prosodyEmbedding =
        prosodyEmbeddingService.generateProsodyEmbedding(prosodyData);

      // Combine text + prosody embeddings
      combinedEmbedding = prosodyEmbeddingService.combinedEmbedding(
        textEmbedding,
        prosodyEmbedding
      );

      emotionIntensity = prosodyEmbedding.emotionIntensity;
      retentionTTL =
        prosodyEmbeddingService.computeRetentionTTL(emotionIntensity);
    }

    // Context weight (default 1.0, can be adjusted based on conversation context)
    const contextWeight = 1.0;

    await vectorDBService.storeMemoryMoment({
      id: memoryMoment.id,
      content: memoryMoment.content,
      userId: memoryMoment.userId,
      emotion: memoryMoment.emotion,
      tone: memoryMoment.tone,
      vector: combinedEmbedding,
      emotionIntensity,
      contextWeight,
      retentionTTL,
      timestamp: memoryMoment.createdAt,
    });

    console.log(
      `✅ Memory moment ${memoryMoment.id} stored in VectorDB (emotion: ${
        memoryMoment.emotion
      }, intensity: ${emotionIntensity.toFixed(2)}, TTL: ${retentionTTL}d)`
    );
  } catch (error) {
    console.error("Failed to store memory moment in VectorDB:", error);
    // Continue even if vector storage fails
  }

  return memoryMoment;
}

export async function updateMemoryMoment(
  id: string,
  data: Prisma.MemoryMomentUncheckedUpdateInput
): Promise<MemoryMoment> {
  return prisma.memoryMoment.update({ where: { id }, data });
}

export async function deleteMemoryMoment(id: string): Promise<MemoryMoment> {
  return prisma.memoryMoment.delete({ where: { id } });
}

export async function searchMemoryMoments(
  query: string,
  userId: string,
  limit: number = 10,
  prosodyData?: ProsodyData
): Promise<any[]> {
  try {
    // Generate text embedding for the search query
    const textEmbedding = await embeddingService.createEmbedding(query);

    // Generate combined embedding if prosody data provided
    let queryEmbedding = textEmbedding;
    let queryEmotionIntensity = 0.5;

    if (prosodyData) {
      const prosodyEmbedding =
        prosodyEmbeddingService.generateProsodyEmbedding(prosodyData);
      queryEmbedding = prosodyEmbeddingService.combinedEmbedding(
        textEmbedding,
        prosodyEmbedding
      );
      queryEmotionIntensity = prosodyEmbedding.emotionIntensity;
    }

    // Search in vector database
    const results = await vectorDBService.searchMemoryMoments(
      queryEmbedding,
      userId,
      limit * 2 // Get more results for re-ranking
    );

    // Re-rank results with emotion-weighted scoring
    const rankedResults = results.map((result: any) => {
      // Weaviate certainty is similarity score (0-1)
      const semanticSimilarity = result._additional?.certainty || 0;
      const emotionIntensity = result.emotionIntensity || 0.5;

      // Compute emotion-weighted score
      const emotionScore = prosodyEmbeddingService.computeEmotionWeightedScore(
        semanticSimilarity,
        emotionIntensity
      );

      // Boost if query and result emotion intensities are similar
      const emotionSimilarity =
        1 - Math.abs(queryEmotionIntensity - emotionIntensity);
      const finalScore = emotionScore * (0.8 + emotionSimilarity * 0.2);

      return {
        ...result,
        score: finalScore,
        semanticSimilarity,
        emotionIntensity,
      };
    });

    // Sort by final score and return top N
    rankedResults.sort((a: any, b: any) => b.score - a.score);
    const topResults = rankedResults.slice(0, limit);

    console.log(
      `🔍 Found ${topResults.length} memory moments (emotion-weighted scoring)`
    );
    return topResults;
  } catch (error) {
    console.error("Memory moment search failed:", error);
    // Fallback to database text search
    return prisma.memoryMoment.findMany({
      where: {
        userId,
        content: { contains: query, mode: "insensitive" },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}

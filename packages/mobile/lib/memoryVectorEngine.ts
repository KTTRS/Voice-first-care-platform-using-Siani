/**
 * Memory Vector Engine
 *
 * Converts memory moments into emotion vectors for similarity-based retrieval.
 * Enables Siani to find "moments like this one" and reference past emotional patterns.
 *
 * Uses OpenAI embeddings API (or can use local Hugging Face model).
 *
 * Philosophy: Best friend who remembers emotional context, not just facts.
 */

import { MemoryMoment, MemoryVector } from "./sianiMemory";

/**
 * Configuration for embedding service
 */
export const EMBEDDING_CONFIG = {
  provider: "openai", // or "huggingface" for local
  model: "text-embedding-ada-002", // OpenAI's 1536-dim model
  dimensions: 1536,
};

/**
 * Generate embedding vector for text
 *
 * In production, this calls OpenAI API or local embedding model.
 * For development/demo, we use a simple hash-based vector.
 */
export async function embedText(text: string): Promise<number[]> {
  // TODO: Replace with actual OpenAI API call
  // const response = await fetch("https://api.openai.com/v1/embeddings", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${OPENAI_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     model: EMBEDDING_CONFIG.model,
  //     input: text,
  //   }),
  // });
  //
  // const data = await response.json();
  // return data.data[0].embedding;

  // Simple hash-based vector for development (NOT FOR PRODUCTION)
  return generateSimpleVector(text);
}

/**
 * Generate embedding for a memory moment
 * Combines text, mood, and context into a single vector
 */
export async function embedMemoryMoment(
  moment: MemoryMoment
): Promise<MemoryVector> {
  // Combine text with emotional metadata for richer embedding
  const enrichedText = `${moment.text}. Mood: ${moment.mood}. ${
    moment.context || ""
  }`;

  const vector = await embedText(enrichedText);

  return {
    id: `vec_${moment.id}`,
    userId: moment.userId,
    memoryMomentId: moment.id,
    vector,
    timestamp: moment.timestamp,
  };
}

/**
 * Calculate cosine similarity between two vectors
 * Returns 0 to 1 (higher = more similar)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have same dimensions");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find similar memory vectors
 */
export function findSimilarVectors(
  queryVector: number[],
  allVectors: MemoryVector[],
  topK: number = 5,
  minSimilarity: number = 0.7
): Array<{ vector: MemoryVector; similarity: number }> {
  const similarities = allVectors.map((vec) => ({
    vector: vec,
    similarity: cosineSimilarity(queryVector, vec.vector),
  }));

  return similarities
    .filter((s) => s.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Simple vector generation for development
 * Uses character-based hashing (NOT suitable for production)
 */
function generateSimpleVector(text: string): number[] {
  const normalized = text.toLowerCase();
  const vector = new Array(EMBEDDING_CONFIG.dimensions).fill(0);

  // Simple hash: distribute characters across vector dimensions
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const index = (i * 37 + charCode) % EMBEDDING_CONFIG.dimensions;
    vector[index] += 1 / (normalized.length + 1);
  }

  // Add some randomness based on text length and content
  const wordCount = normalized.split(/\s+/).length;
  for (let i = 0; i < wordCount && i < EMBEDDING_CONFIG.dimensions; i++) {
    vector[i] += 0.1;
  }

  // Normalize vector
  let magnitude = 0;
  for (let i = 0; i < vector.length; i++) {
    magnitude += vector[i] * vector[i];
  }
  magnitude = Math.sqrt(magnitude);

  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

/**
 * Memory Vector Store
 * Manages vectors in memory (synced to backend)
 */
class MemoryVectorStore {
  private vectors: MemoryVector[] = [];

  /**
   * Add a vector to the store
   */
  async addVector(moment: MemoryMoment): Promise<MemoryVector> {
    const vector = await embedMemoryMoment(moment);
    this.vectors.push(vector);
    return vector;
  }

  /**
   * Find similar moments based on current text
   */
  async findSimilarMoments(
    text: string,
    topK: number = 5,
    minSimilarity: number = 0.7
  ): Promise<Array<{ vector: MemoryVector; similarity: number }>> {
    const queryVector = await embedText(text);
    return findSimilarVectors(queryVector, this.vectors, topK, minSimilarity);
  }

  /**
   * Find similar moments by mood
   */
  async findMomentsByMood(
    mood: string,
    topK: number = 5
  ): Promise<Array<{ vector: MemoryVector; similarity: number }>> {
    const queryText = `I feel ${mood}`;
    return this.findSimilarMoments(queryText, topK, 0.6);
  }

  /**
   * Get all vectors for syncing
   */
  getAllVectors(): MemoryVector[] {
    return [...this.vectors];
  }

  /**
   * Clear synced vectors
   */
  clearSyncedVectors(vectorIds: string[]) {
    this.vectors = this.vectors.filter((v) => !vectorIds.includes(v.id));
  }

  /**
   * Load vectors from backend
   */
  loadVectors(vectors: MemoryVector[]) {
    this.vectors = vectors;
  }
}

// Singleton instance
export const memoryVectorStore = new MemoryVectorStore();

/**
 * Enhanced similarity search with emotional context
 */
export interface SimilarMomentResult {
  memoryMomentId: string;
  similarity: number;
  timeSince: string; // "a few days ago", "last week", etc.
  moodMatch: boolean;
  contextMatch: boolean;
}

/**
 * Search for similar moments with rich context
 */
export async function searchSimilarMoments(
  currentText: string,
  currentMood: string,
  allMoments: MemoryMoment[],
  topK: number = 3
): Promise<SimilarMomentResult[]> {
  // Create vectors for all moments if not already done
  for (const moment of allMoments) {
    const exists = memoryVectorStore
      .getAllVectors()
      .find((v) => v.memoryMomentId === moment.id);
    if (!exists) {
      await memoryVectorStore.addVector(moment);
    }
  }

  // Find similar vectors
  const similar = await memoryVectorStore.findSimilarMoments(
    currentText,
    topK,
    0.65
  );

  // Enrich with moment metadata
  const results: SimilarMomentResult[] = [];

  for (const { vector, similarity } of similar) {
    const moment = allMoments.find((m) => m.id === vector.memoryMomentId);
    if (!moment) continue;

    const daysSince = Math.floor(
      (Date.now() - moment.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    let timeSince: string;
    if (daysSince < 1) timeSince = "today";
    else if (daysSince < 2) timeSince = "yesterday";
    else if (daysSince < 7) timeSince = "a few days ago";
    else if (daysSince < 14) timeSince = "last week";
    else if (daysSince < 30) timeSince = "a couple weeks back";
    else if (daysSince < 60) timeSince = "last month";
    else timeSince = "a while back";

    results.push({
      memoryMomentId: moment.id,
      similarity,
      timeSince,
      moodMatch: moment.mood === currentMood,
      contextMatch: moment.sdohCategory !== undefined,
    });
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Generate a natural reference to a similar past moment
 */
export function generateSimilarityReference(
  similarMoment: SimilarMomentResult,
  originalMoment: MemoryMoment
): string | null {
  // Only reference if similarity is high enough and not too recent
  if (similarMoment.similarity < 0.75) return null;
  if (
    similarMoment.timeSince === "today" ||
    similarMoment.timeSince === "yesterday"
  ) {
    return null;
  }

  const templates = [
    `I remember you felt something kind of like this ${similarMoment.timeSince}. Want to talk about how this one feels different?`,
    `This reminds me of what you were going through ${similarMoment.timeSince}. Feels similar?`,
    `You said something like this ${similarMoment.timeSince}. Has anything changed since then?`,
    `This sounds familiar to something you mentioned ${similarMoment.timeSince}. Same kind of thing or different?`,
  ];

  // If mood matches, acknowledge the pattern
  if (similarMoment.moodMatch) {
    const moodTemplates = [
      `It sounds like you're in that same headspace you were ${similarMoment.timeSince}. What do you think is bringing this up again?`,
      `I'm noticing you're feeling like you did ${similarMoment.timeSince}. Want to talk through it?`,
    ];
    templates.push(...moodTemplates);
  }

  return templates[Math.floor(Math.random() * templates.length)];
}

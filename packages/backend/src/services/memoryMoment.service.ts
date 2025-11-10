import { MemoryMoment, Prisma } from "@prisma/client";
import prisma from "../utils/db";
import { embeddingService } from "./embedding.service";
import { vectorDBService } from "./vectordb.service";

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
  data: Prisma.MemoryMomentUncheckedCreateInput
): Promise<MemoryMoment> {
  // Create the memory moment in the database
  const memoryMoment = await prisma.memoryMoment.create({ data });

  // Generate embedding and store in vector database
  try {
    const embedding = await embeddingService.createEmbedding(
      memoryMoment.content
    );

    await vectorDBService.storeMemoryMoment({
      id: memoryMoment.id,
      content: memoryMoment.content,
      userId: memoryMoment.userId,
      emotion: memoryMoment.emotion,
      tone: memoryMoment.tone,
      vector: embedding,
      timestamp: memoryMoment.createdAt,
    });

    console.log(`✅ Memory moment ${memoryMoment.id} stored in VectorDB`);
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
  limit: number = 10
): Promise<any[]> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await embeddingService.createEmbedding(query);

    // Search in vector database
    const results = await vectorDBService.searchMemoryMoments(
      queryEmbedding,
      userId,
      limit
    );

    console.log(`🔍 Found ${results.length} similar memory moments`);
    return results;
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

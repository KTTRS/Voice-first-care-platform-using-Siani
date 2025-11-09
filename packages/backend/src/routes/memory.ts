import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { embeddingService } from '../services/embedding.service';
import { vectorDBService } from '../services/vectordb.service';

const router = Router();

const createMemorySchema = z.object({
  content: z.string(),
  conversationId: z.string().optional(),
  importance: z.number().min(0).max(1).default(0.5),
  metadata: z.any().optional(),
});

const searchMemorySchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(50).default(10),
  conversationId: z.string().optional(),
});

// Initialize vector DB on module load
vectorDBService.initialize().catch(console.error);

// Store a new memory
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createMemorySchema.parse(req.body);

    // Create embedding for the content
    let embedding: number[] | null = null;
    try {
      embedding = await embeddingService.createEmbedding(data.content);
    } catch (error) {
      console.error('Failed to create embedding:', error);
      // Continue without embedding if OpenAI is not available
    }

    // Store in database
    const memory = await prisma.memory.create({
      data: {
        content: data.content,
        embedding: embedding ? JSON.stringify(embedding) : null,
        metadata: data.metadata,
        userId: req.user!.id,
        conversationId: data.conversationId,
        importance: data.importance,
      },
    });

    // Store in vector database if embedding was created
    if (embedding) {
      try {
        await vectorDBService.storeMemory({
          id: memory.id,
          content: data.content,
          userId: req.user!.id,
          conversationId: data.conversationId,
          importance: data.importance,
          vector: embedding,
        });
      } catch (error) {
        console.error('Failed to store in vector DB:', error);
        // Continue even if vector DB storage fails
      }
    }

    res.status(201).json(memory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Memory creation error:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// Search memories using semantic search
router.post('/search', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = searchMemorySchema.parse(req.body);

    // Create embedding for the search query
    let embedding: number[] | null = null;
    try {
      embedding = await embeddingService.createEmbedding(data.query);
    } catch (error) {
      console.error('Failed to create search embedding:', error);
    }

    // Search using vector database if available
    let vectorResults: any[] = [];
    if (embedding) {
      try {
        vectorResults = await vectorDBService.searchMemories(
          embedding,
          req.user!.id,
          data.limit
        );
      } catch (error) {
        console.error('Vector search failed:', error);
      }
    }

    // Fallback to database text search if vector search didn't work
    if (vectorResults.length === 0) {
      const where: any = { userId: req.user!.id };
      if (data.conversationId) {
        where.conversationId = data.conversationId;
      }

      const dbResults = await prisma.memory.findMany({
        where,
        orderBy: [
          { importance: 'desc' },
          { accessedAt: 'desc' },
        ],
        take: data.limit,
      });

      res.json({
        results: dbResults,
        source: 'database',
      });
    } else {
      // Update access time for retrieved memories
      const memoryIds = vectorResults.map((r: any) => r.id);
      if (memoryIds.length > 0) {
        await prisma.memory.updateMany({
          where: { id: { in: memoryIds } },
          data: { accessedAt: new Date() },
        });
      }

      res.json({
        results: vectorResults,
        source: 'vector-db',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Memory search error:', error);
    res.status(500).json({ error: 'Failed to search memories' });
  }
});

// Get memories for a conversation
router.get('/conversation/:conversationId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const memories = await prisma.memory.findMany({
      where: {
        userId: req.user!.id,
        conversationId: req.params.conversationId,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// Get memory statistics
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const totalMemories = await prisma.memory.count({
      where: { userId: req.user!.id },
    });

    const recentMemories = await prisma.memory.count({
      where: {
        userId: req.user!.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const conversationCount = await prisma.memory.groupBy({
      by: ['conversationId'],
      where: {
        userId: req.user!.id,
        conversationId: { not: null },
      },
    });

    res.json({
      total: totalMemories,
      recent: recentMemories,
      conversations: conversationCount.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Delete a memory
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const memory = await prisma.memory.findUnique({
      where: { id: req.params.id },
    });

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    if (memory.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.memory.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

export { router as memoryRouter };

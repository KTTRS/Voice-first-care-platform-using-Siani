import weaviate, { WeaviateClient, ApiKey } from "weaviate-ts-client";
import logger from "../utils/logger";

class VectorDBService {
  private client: WeaviateClient | null = null;

  async initialize() {
    try {
      const clientConfig: {
        scheme: string;
        host: string;
        apiKey?: ApiKey;
      } = {
        scheme: process.env.WEAVIATE_URL?.startsWith("https")
          ? "https"
          : "http",
        host:
          process.env.WEAVIATE_URL?.replace(/^https?:\/\//, "") ||
          "localhost:8080",
      };

      if (process.env.WEAVIATE_API_KEY) {
        clientConfig.apiKey = new ApiKey(process.env.WEAVIATE_API_KEY);
      }

      this.client = weaviate.client(clientConfig);

      // Create schema if it doesn't exist
      await this.createSchema();

      logger.info("Weaviate connection established");
    } catch (error) {
      logger.error("Failed to connect to Weaviate:", { error: error.message });
      // Don't throw - allow app to start even if vector DB is not available
    }
  }

  private async createSchema() {
    if (!this.client) return;

    // Memory schema (for conversation memories)
    const memorySchema = {
      class: "Memory",
      description: "Patient care memories and conversation context",
      vectorizer: "none", // We'll provide our own vectors
      properties: [
        {
          name: "content",
          dataType: ["text"],
          description: "The content of the memory",
        },
        {
          name: "userId",
          dataType: ["string"],
          description: "User ID associated with the memory",
        },
        {
          name: "conversationId",
          dataType: ["string"],
          description: "Conversation ID",
        },
        {
          name: "importance",
          dataType: ["number"],
          description: "Importance score of the memory",
        },
        {
          name: "timestamp",
          dataType: ["date"],
          description: "When the memory was created",
        },
      ],
    };

    // MemoryMoment schema (for daily reflections/moments)
    const memoryMomentSchema = {
      class: "MemoryMoment",
      description: "Patient daily moments and emotional reflections",
      vectorizer: "none",
      properties: [
        {
          name: "content",
          dataType: ["text"],
          description: "The content of the memory moment",
        },
        {
          name: "userId",
          dataType: ["string"],
          description: "User ID who created this moment",
        },
        {
          name: "emotion",
          dataType: ["string"],
          description: "Emotion associated with the moment",
        },
        {
          name: "tone",
          dataType: ["string"],
          description: "Tone of the moment",
        },
        {
          name: "emotionIntensity",
          dataType: ["number"],
          description: "Emotion intensity score (0-1)",
        },
        {
          name: "contextWeight",
          dataType: ["number"],
          description: "Context importance weight for retrieval",
        },
        {
          name: "retentionTTL",
          dataType: ["number"],
          description: "Retention time-to-live in days",
        },
        {
          name: "timestamp",
          dataType: ["date"],
          description: "When the moment was created",
        },
      ],
    };

    try {
      // Create Memory schema
      const memoryExists = await this.client.schema
        .classGetter()
        .withClassName("Memory")
        .do();
      if (!memoryExists) {
        await this.client.schema.classCreator().withClass(memorySchema).do();
        console.log("✅ Created Memory schema");
      }
    } catch (error) {
      console.log("Memory schema note:", error);
    }

    try {
      // Create MemoryMoment schema
      const momentExists = await this.client.schema
        .classGetter()
        .withClassName("MemoryMoment")
        .do();
      if (!momentExists) {
        await this.client.schema
          .classCreator()
          .withClass(memoryMomentSchema)
          .do();
        console.log("✅ Created MemoryMoment schema");
      }
    } catch (error) {
      console.log("MemoryMoment schema note:", error);
    }
  }

  async storeMemory(data: {
    id: string;
    content: string;
    userId: string;
    conversationId?: string;
    importance: number;
    vector: number[];
  }) {
    if (!this.client) {
      console.warn("Vector DB not available");
      return null;
    }

    try {
      const result = await this.client.data
        .creator()
        .withClassName("Memory")
        .withId(data.id)
        .withProperties({
          content: data.content,
          userId: data.userId,
          conversationId: data.conversationId || "",
          importance: data.importance,
          timestamp: new Date().toISOString(),
        })
        .withVector(data.vector)
        .do();

      return result;
    } catch (error) {
      console.error("Error storing memory in vector DB:", error);
      throw error;
    }
  }

  async searchMemories(vector: number[], userId: string, limit: number = 10) {
    if (!this.client) {
      console.warn("Vector DB not available");
      return [];
    }

    try {
      const result = await this.client.graphql
        .get()
        .withClassName("Memory")
        .withFields(
          "content userId conversationId importance timestamp _additional { distance }"
        )
        .withNearVector({ vector })
        .withWhere({
          path: ["userId"],
          operator: "Equal",
          valueString: userId,
        })
        .withLimit(limit)
        .do();

      return result.data.Get.Memory || [];
    } catch (error) {
      console.error("Error searching memories:", error);
      return [];
    }
  }

  // Memory Moment methods
  async storeMemoryMoment(data: {
    id: string;
    content: string;
    userId: string;
    emotion: string;
    tone: string;
    vector: number[];
    emotionIntensity: number;
    contextWeight: number;
    retentionTTL: number;
    timestamp: Date;
  }) {
    if (!this.client) {
      console.warn("Vector DB not available for memory moment");
      return null;
    }

    try {
      // Weaviate requires UUID format, so we'll generate one from the CUID
      const crypto = require("crypto");
      const uuid = crypto.createHash("md5").update(data.id).digest("hex");
      const formattedUuid = `${uuid.slice(0, 8)}-${uuid.slice(
        8,
        12
      )}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20, 32)}`;

      const result = await this.client.data
        .creator()
        .withClassName("MemoryMoment")
        .withId(formattedUuid)
        .withProperties({
          content: data.content,
          userId: data.userId,
          emotion: data.emotion,
          tone: data.tone,
          emotionIntensity: data.emotionIntensity,
          contextWeight: data.contextWeight,
          retentionTTL: data.retentionTTL,
          timestamp: data.timestamp.toISOString(),
        })
        .withVector(data.vector)
        .do();

      return result;
    } catch (error) {
      console.error("Error storing memory moment in vector DB:", error);
      throw error;
    }
  }

  async searchMemoryMoments(
    vector: number[],
    userId: string,
    limit: number = 10
  ) {
    if (!this.client) {
      console.warn("Vector DB not available");
      return [];
    }

    try {
      const result = await this.client.graphql
        .get()
        .withClassName("MemoryMoment")
        .withFields(
          "content userId emotion tone emotionIntensity contextWeight retentionTTL timestamp _additional { distance certainty }"
        )
        .withNearVector({ vector })
        .withWhere({
          path: ["userId"],
          operator: "Equal",
          valueString: userId,
        })
        .withLimit(limit)
        .do();

      return result.data.Get.MemoryMoment || [];
    } catch (error) {
      console.error("Error searching memory moments:", error);
      return [];
    }
  }

  async getMemoryMomentsByEmotion(
    emotion: string,
    userId: string,
    limit: number = 10
  ) {
    if (!this.client) {
      console.warn("Vector DB not available");
      return [];
    }

    try {
      const result = await this.client.graphql
        .get()
        .withClassName("MemoryMoment")
        .withFields(
          "content userId emotion tone emotionIntensity contextWeight retentionTTL timestamp _additional { certainty }"
        )
        .withWhere({
          operator: "And",
          operands: [
            {
              path: ["userId"],
              operator: "Equal",
              valueString: userId,
            },
            {
              path: ["emotion"],
              operator: "Equal",
              valueString: emotion,
            },
          ],
        })
        .withLimit(limit)
        .do();

      return result.data.Get.MemoryMoment || [];
    } catch (error) {
      console.error("Error getting memory moments by emotion:", error);
      return [];
    }
  }
}

export const vectorDBService = new VectorDBService();

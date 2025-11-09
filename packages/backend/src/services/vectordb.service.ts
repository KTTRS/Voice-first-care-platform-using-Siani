import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';

class VectorDBService {
  private client: WeaviateClient | null = null;

  async initialize() {
    try {
      const clientConfig: any = {
        scheme: process.env.WEAVIATE_URL?.startsWith('https') ? 'https' : 'http',
        host: process.env.WEAVIATE_URL?.replace(/^https?:\/\//, '') || 'localhost:8080',
      };

      if (process.env.WEAVIATE_API_KEY) {
        clientConfig.apiKey = new ApiKey(process.env.WEAVIATE_API_KEY);
      }

      this.client = weaviate.client(clientConfig);

      // Create schema if it doesn't exist
      await this.createSchema();
      
      console.log('✅ Weaviate connection established');
    } catch (error) {
      console.error('❌ Failed to connect to Weaviate:', error);
      // Don't throw - allow app to start even if vector DB is not available
    }
  }

  private async createSchema() {
    if (!this.client) return;

    const schemaConfig = {
      class: 'Memory',
      description: 'Patient care memories and conversation context',
      vectorizer: 'none', // We'll provide our own vectors
      properties: [
        {
          name: 'content',
          dataType: ['text'],
          description: 'The content of the memory',
        },
        {
          name: 'userId',
          dataType: ['string'],
          description: 'User ID associated with the memory',
        },
        {
          name: 'conversationId',
          dataType: ['string'],
          description: 'Conversation ID',
        },
        {
          name: 'importance',
          dataType: ['number'],
          description: 'Importance score of the memory',
        },
        {
          name: 'timestamp',
          dataType: ['date'],
          description: 'When the memory was created',
        },
      ],
    };

    try {
      const exists = await this.client.schema.classGetter().withClassName('Memory').do();
      if (!exists) {
        await this.client.schema.classCreator().withClass(schemaConfig).do();
      }
    } catch (error) {
      // Schema might already exist
      console.log('Schema creation note:', error);
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
      console.warn('Vector DB not available');
      return null;
    }

    try {
      const result = await this.client.data
        .creator()
        .withClassName('Memory')
        .withId(data.id)
        .withProperties({
          content: data.content,
          userId: data.userId,
          conversationId: data.conversationId || '',
          importance: data.importance,
          timestamp: new Date().toISOString(),
        })
        .withVector(data.vector)
        .do();

      return result;
    } catch (error) {
      console.error('Error storing memory in vector DB:', error);
      throw error;
    }
  }

  async searchMemories(vector: number[], userId: string, limit: number = 10) {
    if (!this.client) {
      console.warn('Vector DB not available');
      return [];
    }

    try {
      const result = await this.client.graphql
        .get()
        .withClassName('Memory')
        .withFields('content userId conversationId importance timestamp _additional { distance }')
        .withNearVector({ vector })
        .withWhere({
          path: ['userId'],
          operator: 'Equal',
          valueString: userId,
        })
        .withLimit(limit)
        .do();

      return result.data.Get.Memory || [];
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }
}

export const vectorDBService = new VectorDBService();

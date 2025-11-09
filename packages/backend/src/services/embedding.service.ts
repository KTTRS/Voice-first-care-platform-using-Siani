import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class EmbeddingService {
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      });
      
      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error creating embeddings:', error);
      throw error;
    }
  }
}

export const embeddingService = new EmbeddingService();

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class EmbeddingService {
  private useMockEmbeddings =
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "your-openai-api-key";

  // Generate a deterministic mock embedding based on text content
  private createMockEmbedding(text: string): number[] {
    const vector: number[] = [];
    const dimension = 1536; // Same as OpenAI ada-002

    // Use text content to seed the vector (deterministic but varied)
    const seed = text
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 0; i < dimension; i++) {
      // Generate pseudo-random but deterministic values
      const value =
        Math.sin(seed * i * 0.001) * Math.cos(text.length * i * 0.002);
      vector.push(value);
    }

    // Normalize the vector
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return vector.map((val) => val / magnitude);
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (this.useMockEmbeddings) {
      console.log("📊 Using mock embedding (OpenAI key not configured)");
      return this.createMockEmbedding(text);
    }

    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating embedding, falling back to mock:", error);
      return this.createMockEmbedding(text);
    }
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    if (this.useMockEmbeddings) {
      console.log(`📊 Using mock embeddings for ${texts.length} texts`);
      return texts.map((text) => this.createMockEmbedding(text));
    }

    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error("Error creating embeddings, falling back to mock:", error);
      return texts.map((text) => this.createMockEmbedding(text));
    }
  }
}

export const embeddingService = new EmbeddingService();

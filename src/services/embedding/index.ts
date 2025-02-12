// src/services/embeddings/index.ts
import OpenAI from 'openai';
import { CONFIG } from '../../config';

export class EmbeddingService {
  private openai = new OpenAI({ apiKey: CONFIG.openai.apiKey });

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  }
}

import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from 'langchain/document';
import { keys } from '@/config/keys.js';
import { AppError } from '@/utils/errors.js';

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: keys.openai.apiKey,
      modelName: 'text-embedding-ada-002',
    });
  }

  async embedDocuments(documents: Document[], options?: { 
    onProgress?: (current: number, total: number) => void 
  }) {
    if (!documents?.length) {
      throw new AppError('No documents provided for embedding', 'EMBEDDING_ERROR');
    }

    const embeddedDocs = await Promise.all(
      documents.map(async (doc, index) => {
        const embedding = await this.embeddings.embedQuery(doc.pageContent);
        options?.onProgress?.(index + 1, documents.length);
        return {
          ...doc,
          embedding,
        };
      })
    );

    return {
      success: true,
      data: {
        documents: embeddedDocs,
        count: embeddedDocs.length,
      }
    };
  }
}
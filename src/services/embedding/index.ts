import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from 'langchain/document';
import { keys } from '@/config/keys.js';
import { AppError } from '@/utils/errors.js';
import { Result, err, ok } from 'neverthrow';

export type EmbeddingResult = {
  data: {
    documents: (Document & { embedding: number[] })[];
    count: number;
  }
};

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: keys.openai.apiKey,
      modelName: 'text-embedding-ada-002',
    });
  }

  async embedDocuments(
    documents: Document[],
    options?: {
      onProgress?: (current: number, total: number) => void
    }
  ): Promise<Result<EmbeddingResult, AppError>> {
    if (!documents?.length) {
      return err(new AppError('No documents provided for embedding', 'EMBEDDING_ERROR'));
    }

    try {
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

      return ok({
        data: {
          documents: embeddedDocs,
          count: embeddedDocs.length,
        }
      });
    } catch (error) {
      return err(new AppError(
        error instanceof Error ? error.message : 'Failed to generate embeddings',
        'EMBEDDING_ERROR'
      ));
    }
  }
}
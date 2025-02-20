import { Pinecone } from '@pinecone-database/pinecone';
import { Result, err, ok } from 'neverthrow';
import { AppError } from '@/utils/errors.js';
import { keys } from '@/config/keys.js';

interface ExtractedDocument {
  id: string;
  content: string;
  metadata: {
    title: string;
    sourceId: string;
    created_time: string;
    last_edited_time: string;
    url?: string;
    properties?: Record<string, any>;
  }
}

interface DocumentWithEmbedding {
  id: string;
  values: number[];
  metadata: {
    content: string;
    title: string;
    sourceId: string;
    created_time: string;
    last_edited_time: string;
    url?: string;
    properties?: Record<string, any>;
  }
}

interface EmbeddingResult {
  data: {
    documents: DocumentWithEmbedding[];
    count: number;
  }
}

export class EmbeddingService {
  private client: Pinecone;
  private model = 'multilingual-e5-large';

  constructor() {
    this.client = new Pinecone({ apiKey: keys.pinecone.apiKey });
  }

  async embedDocuments(
    documents: ExtractedDocument[],
    options?: {
      onProgress?: (current: number, total: number) => void
    }
  ): Promise<Result<EmbeddingResult, AppError>> {
    if (!documents?.length) {
      return err(new AppError('No documents provided for embedding', 'EMBEDDING_ERROR'));
    }

    try {
      const inputs = documents.map(doc => doc.content);
      
      const embeddings = await this.client.inference.embed(
        this.model,
        inputs,
        { 
          inputType: 'passage',
          truncate: 'END'
        }
      );

      const embeddedDocs = documents.map((doc, i) => {
        const embeddingValues = embeddings[i]?.values;
        if (!embeddingValues) {
          throw new Error(`Failed to generate embedding for document ${doc.id}`);
        }

        return {
          id: doc.id,
          values: embeddingValues,
          metadata: {
            content: doc.content,
            ...doc.metadata
          }
        };
      });

      options?.onProgress?.(documents.length, documents.length);

      return ok({
        data: {
          documents: embeddedDocs,
          count: embeddedDocs.length
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
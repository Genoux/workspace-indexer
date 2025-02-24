import { Pinecone, RecordMetadata, PineconeRecord } from '@pinecone-database/pinecone';
import { Result, err, ok } from 'neverthrow';
import { AppError } from '@/utils/errors.js';
import { NotionChunk } from '@/types';
import { env } from '@/config/env.js';

export class EmbeddingService {
  private readonly client: Pinecone;
  private readonly model = 'multilingual-e5-large';
  private readonly batchSize = 96;

  constructor() {
    this.client = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  }

  async embedDocuments(
    documents: NotionChunk[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Result<PineconeRecord<RecordMetadata>[], AppError>> {
    if (!documents?.length) {
      return err(new AppError('No documents provided for embedding', 'EMBEDDING_ERROR'));
    }

    try {
      const records: PineconeRecord<RecordMetadata>[] = [];

      for (let i = 0; i < documents.length; i += this.batchSize) {
        const batch = documents.slice(i, i + this.batchSize);

        const embeddings = await this.client.inference.embed(
          this.model,
          batch.map(doc => doc.text),
          { inputType: 'passage', truncate: 'END' }
        );

        const batchRecords = batch.map((doc, j) => {
          const embedding = embeddings.data[j];
          if (!('vectorType' in embedding) || embedding.vectorType !== 'dense') {
            throw new Error('Unexpected embedding format');
          }

          return {
            id: doc.pageId,
            values: embedding.values,
            metadata: {
              ...doc,
            }
          };
        });

        records.push(...batchRecords);
        onProgress?.(Math.min(i + this.batchSize, documents.length), documents.length);
      }

      return ok(records);
    } catch (error) {
      return err(new AppError(
        error instanceof Error ? error.message : 'Failed to generate embeddings',
        'EMBEDDING_ERROR'
      ));
    }
  }
}
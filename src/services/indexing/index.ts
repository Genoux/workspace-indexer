import { Pinecone, RecordMetadata, PineconeRecord } from '@pinecone-database/pinecone';
import { Result, err, ok } from 'neverthrow';
import { AppError } from '@/utils/errors.js';
import { env } from '@/config/env.js';

export class IndexingService {
  private readonly client: Pinecone;
  private readonly batchSize = 100;

  constructor() {
    this.client = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  }

  async upsert(
    indexName: string,
    namespace: string,
    records: PineconeRecord<RecordMetadata>[]
  ): Promise<Result<{ count: number }, AppError>> {
    if (!records?.length) {
      return err(new AppError('No records provided for indexing', 'INDEXING_ERROR'));
    }

    try {
      const index = this.client.Index<RecordMetadata>(indexName);
      
      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        await index.namespace(namespace).upsert(batch);
      }

      return ok({ count: records.length });
    } catch (error) {
      return err(new AppError(
        error instanceof Error ? error.message : 'Failed to index documents',
        'INDEXING_ERROR'
      ));
    }
  }
}
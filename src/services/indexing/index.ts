// src/services/indexing/index.ts
import { Pinecone, RecordMetadata, PineconeRecord } from '@pinecone-database/pinecone';
import { Result, err, ok } from 'neverthrow';
import { ProgressCallback } from '@/types';
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
    records: PineconeRecord<RecordMetadata>[],
    onProgress?: ProgressCallback
  ): Promise<Result<{ count: number }, Error>> {
    if (!records?.length) {
      return err(new Error('No records provided for indexing'));
    }
    
    try {
      const index = this.client.Index<RecordMetadata>(indexName);
      
      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        await index.namespace(namespace).upsert(batch);
        
        const processed = i + batch.length;
        
        onProgress?.({
          stage: 'indexing',
          percent: Math.floor((processed / records.length) * 100),
          message: `Indexed ${processed}/${records.length} vectors`
        });
      }
      
      return ok({ count: records.length });
    } catch (error) {
      return err(new Error(`Failed to index records: ${error}`));
    }
  }
}
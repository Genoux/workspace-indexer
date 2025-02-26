// src/services/embedding/index.ts
import { Pinecone, RecordMetadata, PineconeRecord } from '@pinecone-database/pinecone';
import { err, ok, Result } from 'neverthrow';
import { NotionChunk, ProgressCallback } from '@/types';
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
    onProgress?: ProgressCallback
  ): Promise<Result<PineconeRecord<RecordMetadata>[], Error>> {
    if (!documents?.length) {
      return err(new Error('No documents provided for embedding'));
    }
    
    try {
      const records: PineconeRecord<RecordMetadata>[] = [];
      const totalBatches = Math.ceil(documents.length / this.batchSize);
      
      for (let i = 0; i < documents.length; i += this.batchSize) {
        const batch = documents.slice(i, i + this.batchSize);
        const batchNum = Math.floor(i / this.batchSize) + 1;
        
        onProgress?.({
          stage: 'embedding',
          percent: Math.floor((i / documents.length) * 100),
          message: `Embedding batch ${batchNum}/${totalBatches}`
        });
        
        const embeddings = await this.client.inference.embed(
          this.model,
          batch.map(doc => doc.text),
          { inputType: 'passage', truncate: 'END' }
        );
        
        // Check for errors in embeddings before processing them
        for (let j = 0; j < embeddings.data.length; j++) {
          const embedding = embeddings.data[j];
          const doc = batch[j];
          
          if (!('vectorType' in embedding) || embedding.vectorType !== 'dense') {
            return err(new Error(`Invalid embedding format for document ${doc.pageId}`));
          }
          
          records.push({
            id: doc.pageId,
            values: embedding.values,
            metadata: { ...doc }
          });
        }
      }
      
      return ok(records);
    } catch (error) {
      return err(new Error(`${error}`));
    }
  }
}
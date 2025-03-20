import { Pinecone, type RecordMetadata, type PineconeRecord } from '@pinecone-database/pinecone';
import { err, ok, type Result } from 'neverthrow';
import type { NotionChunk, ProgressCallback } from '@/types';
import { env } from '@/config/env.js';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

export class EmbeddingService {
  private readonly client: Pinecone;
  private readonly embeddings: HuggingFaceInferenceEmbeddings;
  private readonly batchSize = 32;

  constructor() {
    this.client = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    
    // Use HuggingFaceInferenceEmbeddings which uses the API rather than local models
    this.embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: env.HUGGINGFACE_API_KEY,
      model: "intfloat/e5-large",
      endpointUrl: "https://router.huggingface.co/hf-inference/pipeline/feature-extraction/intfloat/e5-large"
    });
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

        // Process documents in the current batch
        const texts = batch.map(doc => doc.text);
        const embeddings = await this.embeddings.embedDocuments(texts);

        // Create records with embeddings
        for (let j = 0; j < batch.length; j++) {
          records.push({
            id: batch[j].pageId,
            values: embeddings[j],
            metadata: { ...batch[j] }
          });
        }
      }

      return ok(records);
    } catch (error) {
      return err(new Error(`${error}`));
    }
  }
}
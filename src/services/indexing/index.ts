import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import { Result, err, ok } from 'neverthrow';
import { AppError } from '@/utils/errors.js';
import { keys } from '@/config/keys.js';
import type { Config } from '@/types';

type PineconeMetadata = {
  content: string;
  title: string;
  sourceId: string;
  created_time: string;
  last_edited_time: string;
  url?: string;
  properties?: Record<string, string>;
}

interface DocumentWithEmbedding {
  id: string;
  values: number[];
  metadata: PineconeMetadata;
}

interface IndexingResult {
  totalDocuments: number;
  database: string;
  indexName: string;
  namespace: string;
}

export class IndexingService {
  private client: Pinecone;

  constructor() {
    this.client = new Pinecone({ apiKey: keys.pinecone.apiKey });
  }

  private sanitizeMetadata(metadata: PineconeMetadata): RecordMetadata {
    const sanitized: Record<string, string | number | string[]> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (key === 'properties' && value) {
        sanitized[key] = JSON.stringify(value);
      } else if (value !== undefined && value !== null) {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  async index(
    config: Config,
    documents: DocumentWithEmbedding[]
  ): Promise<Result<IndexingResult, AppError>> {
    if (!documents?.length) {
      return err(new AppError('No documents provided for indexing', 'INDEXING_ERROR'));
    }

    try {
      const { index: indexName, namespace } = config.pinecone;
      const index = this.client.Index(indexName);

      const records = documents.map(doc => ({
        id: doc.id,
        values: doc.values,
        metadata: this.sanitizeMetadata(doc.metadata)
      }));

      await index.namespace(namespace).upsert(records);

      return ok({
        totalDocuments: documents.length,
        database: config.notion.id,
        indexName,
        namespace
      });
    } catch (error) {
      return err(new AppError(
        error instanceof Error ? error.message : 'Failed to index documents',
        'INDEXING_ERROR'
      ));
    }
  }
}
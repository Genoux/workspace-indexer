import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { flatten } from 'flat';
import { keys } from '@/config/keys.js';
import type { Config } from '@/config/content.js';
import { AppError } from '@/utils/errors.js';
import { Result, err, ok } from 'neverthrow';

type DocumentWithEmbedding = Document & { embedding: number[] };

interface IndexingParams {
  config: Config;
  documents: DocumentWithEmbedding[];
}

export type IndexingResult = {
  totalDocuments: number;
  database: string;
  indexName: string;
  namespace: string;
}

export class IndexingService {
  private readonly client: Pinecone;

  constructor() {
    this.client = new Pinecone({
      apiKey: keys.pinecone.apiKey,
    });
  }

  private getMetadataVector() {
    const metadataVector = new Array(1536).fill(0);
    metadataVector[0] = 1;
    return metadataVector;
  }

  async index({ config, documents }: IndexingParams): Promise<Result<IndexingResult, AppError>> {
    if (!documents?.length) {
      return err(new AppError('No documents provided for indexing', 'INDEXING_ERROR'));
    }

    try {
      const { index: indexName, namespace } = config.pinecone;
      const { id, docDescription } = config.notion;
      const index = this.client.Index(indexName);

      const records = documents.map(({ metadata, embedding, pageContent }) => ({
        id: `${metadata.sourceId}-chunk-${metadata.chunkIndex}`,
        values: embedding,
        metadata: {
          pageContent,
          ...Object.fromEntries(
            Object.entries(flatten(metadata) as Document).filter(([_, v]) => v !== null)
          ),
        }
      }));

      await index.namespace(namespace).upsert(records);
      const stats = await index.describeIndexStats();

      await index.namespace('_metadata').upsert([{
        id: 'sync_status',
        values: this.getMetadataVector(),
        metadata: {
          lastSyncTime: new Date().toISOString(),
          totalDocuments: documents.length,
          namespace: Object.keys(stats.namespaces || {}),
          dimension: stats.dimension || 0,
          indexFullness: stats.indexFullness || 0,
          totalRecordCount: stats.totalRecordCount || 0,
          indexName: indexName,
          description: docDescription || '',
        }
      }]);

      return ok({
        totalDocuments: documents.length,
        database: id,
        indexName,
        namespace,
      });
    } catch (error) {
      return err(new AppError(
        error instanceof Error ? error.message : 'Failed to index documents',
        'INDEXING_ERROR'
      ));
    }
  }
}
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

  async index({ config, documents }: IndexingParams): Promise<Result<IndexingResult, AppError>> {
    if (!documents?.length) {
      return err(new AppError('No documents provided for indexing', 'INDEXING_ERROR'));
    }

    try {
      const { index: indexName, namespace } = config.pinecone;
      const { id } = config.notion;
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
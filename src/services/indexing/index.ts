import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { logger } from '@/utils/logger';
import { flatten } from 'flat';
import { keys } from '@/config';
import { writeToFile } from '@/utils/writer';

type DocumentWithEmbedding = Document & { embedding: number[] };

interface IndexingParams {
  database: string;
  documents: DocumentWithEmbedding[];
}

export class IndexingService {
  private readonly client: Pinecone;

  constructor() {
    this.client = new Pinecone({
      apiKey: keys.pinecone.apiKey,
    });
  }

  async index({ database, documents }: IndexingParams) {
    const index = this.client.Index(database);

    const records = documents.map(({ metadata, embedding, pageContent }) => ({
      id: `${metadata.sourceId}-chunk-${metadata.chunkIndex}`,
      values: embedding,
      metadata: {
        pageContent,
        ...Object.fromEntries(
          Object.entries(flatten(metadata) as Document).filter(([_, v]) => v !== null)
        )
      }
    }));

    await writeToFile('records.json', JSON.stringify(records, null, 2));
    await index.upsert(records);

    return {
      success: true,
      totalDocuments: documents.length,
      database
    };
  }
}
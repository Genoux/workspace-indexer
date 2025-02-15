import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { flatten } from 'flat';
import { keys } from '@/config/keys.js';
import { writeToFile } from '@/utils/writer.js';

type DocumentWithEmbedding = Document & { embedding: number[] };

interface IndexingParams {
  database: string;
  namespace: string;
  documents: DocumentWithEmbedding[];
}

export class IndexingService {
  private readonly client: Pinecone;
  
  constructor() {
    this.client = new Pinecone({
      apiKey: keys.pinecone.apiKey,
    });
  }

  async index({ database, namespace, documents }: IndexingParams) {
    const index = this.client.Index(database);
    const records = documents.map(({ metadata, embedding, pageContent }) => ({
      id: `${metadata.sourceId}-chunk-${metadata.chunkIndex}`,
      values: embedding,
      metadata: {
        pageContent,
        ...Object.fromEntries(
          Object.entries(flatten(metadata) as Document).filter(([_, v]) => v !== null)
        ),
        cutoffKnowledge: new Date().toISOString(),
      }
    }));

    await index.namespace(namespace).upsert(records);
    return {
      success: true,
      totalDocuments: documents.length,
      database
    };
  }
}
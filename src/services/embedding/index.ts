import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from 'langchain/document';
import { logger } from '@/utils/logger';
import { CONFIG } from '@/config';
import { writeToFile } from '@/utils/writer';

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: CONFIG.openai.apiKey,
      modelName: 'text-embedding-ada-002',
      stripNewLines: true,
      maxConcurrency: 5,
    });
  }

  async embedDocuments(documents: Document[]): Promise<{
    success: boolean;
    data?: {
      documents: Array<Document & { embedding: number[] }>;
      count: number;
    };
    error?: {
      message: string;
      details?: string;
    };
  }> {
    try {
      logger.info({ count: documents.length }, '📊 Starting document embedding');

      const embeddedDocs = await Promise.all(
        documents.map(async (doc, index) => {
          try {
            const embedding = await this.embeddings.embedQuery(doc.pageContent);
            logger.info(`Embedded document ${index + 1}/${documents.length}`);
            
            return {
              ...doc,
              embedding,
            };
          } catch (error) {
            logger.error({ error, docIndex: index }, 'Failed to embed document');
            throw error;
          }
        })
      );

      logger.info(`✅ Successfully embedded ${embeddedDocs.length} documents`);

      return {
        success: true,
        data: {
          documents: embeddedDocs,
          count: embeddedDocs.length,
        },
      };
    } catch (error) {
      logger.error({ error }, '❌ Document embedding failed');
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown embedding error occurred',
          details: error instanceof Error ? error.stack : undefined,
        },
      };
    }
  }
}
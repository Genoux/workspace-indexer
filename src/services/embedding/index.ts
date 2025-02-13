import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from 'langchain/document';
import { logger } from '@/utils/logger';
import { keys } from '@/config';
import { AppError } from '@/utils/errors';

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: keys.openai.apiKey,
      modelName: 'text-embedding-ada-002',
    });
  }

  async embedDocuments(documents: Document[]) {
    if (!documents?.length) {
      throw new AppError('No documents provided for embedding', 'EMBEDDING_ERROR');
    }

    logger.info(`📊 Starting document embedding for ${documents.length} documents`);

    const embeddedDocs = await Promise.all(
      documents.map(async (doc, index) => {
        const embedding = await this.embeddings.embedQuery(doc.pageContent);
        logger.info(`Embedded document ${index + 1}/${documents.length}`);
        return {
          ...doc,
          embedding,
        };
      })
    );

    return {
      success: true,
      data: {
        documents: embeddedDocs,
        count: embeddedDocs.length,
      }
    };
  }
}
// src/core/main.ts
import { config } from 'dotenv';
config();
import { NotionExtractor } from '@/services/extractors/langchain';
import { EmbeddingService } from '@/services/embedding';
import { handleError } from '@/utils/errors';
import { content } from '@/config/content';
import { logger } from '@/utils/logger';

type Database = keyof typeof content;

export async function main(database: Database) {
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  
  try {
    const dbConfig = content[database];
    if (!dbConfig) {
      throw new Error(`Database "${database}" configuration not found`);
    }
    if (!dbConfig.notionId) {
      throw new Error('Notion ID is not set in configuration');
    }

    // Extract documents from Notion
    const notionExtractor = new NotionExtractor();
    const extractionResult = await notionExtractor.extract(dbConfig.notionId, dbConfig.type);

    // Generate embeddings
    const embeddingService = new EmbeddingService();
    const embeddingResult = await embeddingService.embedDocuments(extractionResult.documents);
    
    return {
      success: true,
      data: {
        extraction: extractionResult,
        embedding: embeddingResult.data,
      },
    };
  } catch (error) {
    handleError(error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}
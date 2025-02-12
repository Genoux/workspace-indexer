// src/core/main.ts
import { config } from 'dotenv';
config();
import { LangChainNotionExtractor } from '../services/extractors/langchain';
import { handleError } from '../utils/errors';
import { content } from '../config/content';
import { logger } from '../utils/logger';

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

    logger.info(
      `🔍 Starting extraction for ${dbConfig.notionId.slice(0, 4)}...`,
    );

    const extractor = new LangChainNotionExtractor();
    const result = await extractor.extract(dbConfig.notionId, dbConfig.type);

    logger.info(`Processed ${result.documentCount} chunks`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    handleError(error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}

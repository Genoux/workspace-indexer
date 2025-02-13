import { config } from 'dotenv';
config();
import { NotionExtractor } from '@/services/extractors/langchain';
import { EmbeddingService } from '@/services/embedding';
import { IndexingService } from '@/services/indexing';
import { AppError } from '@/utils/errors';
import { content } from '@/config';
import { logger } from '@/utils/logger';
import { writeToFile } from '@/utils/writer';

type Content = keyof typeof content;

//TODO: Add cool loader
//  ✔ Container plex                   Started 

export async function main(contentKey: Content) {
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Using content: ${contentKey}`);

  // Validate configuration
  const dbConfig = content[contentKey];
  if (!dbConfig) {
    throw new AppError(
      `Database "${contentKey}" configuration not found`,
      'CONFIG_ERROR'
    );
  }
  if (!dbConfig.notion.id) {
    throw new AppError(
      'Notion ID is not set in configuration',
      'CONFIG_ERROR'
    );
  }

  // Extract documents from Notion
  logger.info('🚀 Starting Notion extraction');
  const notionExtractor = new NotionExtractor();
  const extractionResult = await notionExtractor.extract(
    dbConfig.notion.id,
    dbConfig.notion.docType
  );
  await writeToFile('extractionResult.json', JSON.stringify(extractionResult, null, 2));
  logger.info('✅ Notion extraction completed');
  // Generate embeddings
  const embeddingService = new EmbeddingService();
  const embeddingResult = await embeddingService.embedDocuments(
    extractionResult.documents
  );
  logger.info('✅ Embedding completed');
  // Handle indexing with embedded documents
  const indexingService = new IndexingService();
  const indexingResult = await indexingService.index({
    database: dbConfig.pinecone.index,
    documents: embeddingResult.data.documents,
  });
  logger.info('✅ Indexing completed');
  return {
    success: true,
    data: {
      extraction: extractionResult,
      embedding: embeddingResult,
      indexing: indexingResult,
    }
  };
}
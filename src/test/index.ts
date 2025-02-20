import { NotionExtractor } from '@/services/extractors/langchain/index.js';
import { EmbeddingService } from '@/services/embedding/index.js';
import { IndexingService } from '@/services/indexing/index.js';
import type { Config } from '@/config/content.js';
import { content } from '@/config/content.js';
import { logger } from '@/utils/logger.js';

const testConfig: Config = {
  notion: {
    id: content['test-index'].notion.id,
    docType: 'database',
  },
  pinecone: {
    index: 'test-index',
    namespace: 'test'
  }
};

async function runPipelineTest() {
  logger.info('Starting pipeline test...');
  logger.info('\n=== Testing Individual Services ===');

  logger.info('\n--- Extraction Test ---');
  const extractor = new NotionExtractor();
  const extractionResult = await extractor.extract(testConfig, {
    onProgress: (current, total, title) => {
      logger.info(`Extraction Progress: ${current}/${total} - ${title}`);
    }
  });

  if (extractionResult.isErr()) {
    logger.error('Extraction failed:', extractionResult.error);
    return;
  }

  logger.info('Extraction successful!');
  logger.info(`Documents extracted: ${extractionResult.value.documentCount}`);
  if (extractionResult.value.documents.length > 0) {
    logger.info('\nSample extracted document:');
    logger.info(JSON.stringify(extractionResult.value.documents[0], null, 2));
  }

  logger.info('\n--- Embedding Test ---');
  const embeddingService = new EmbeddingService();
  const embeddingResult = await embeddingService.embedDocuments(
    extractionResult.value.documents,
    {
      onProgress: (current, total) => {
        logger.info(`Embedding Progress: ${current}/${total}`);
      }
    }
  );

  if (embeddingResult.isErr()) {
    logger.error('Embedding failed:', embeddingResult.error);
    return;
  }

  logger.info('Embedding successful!');
  if (embeddingResult.value.data.documents.length > 0) {
    const sampleDoc = embeddingResult.value.data.documents[0];
    logger.info('\nSample embedded document:');
    logger.info(JSON.stringify({
      id: sampleDoc.id,
      metadata: sampleDoc.metadata,
      embeddingSize: sampleDoc.values.length,
      firstThreeValues: sampleDoc.values.slice(0, 3)
    }, null, 2));
  }

  logger.info('\n--- Indexing Test ---');
  const indexingService = new IndexingService();
  const indexingResult = await indexingService.index(
    testConfig,
    embeddingResult.value.data.documents
  );

  if (indexingResult.isErr()) {
    logger.error('Indexing failed:', indexingResult.error);
    console.log(indexingResult.error);
    return;
  }

  logger.info('Indexing successful!');
  logger.info('Indexing results:', JSON.stringify(indexingResult.value, null, 2));

}

runPipelineTest()
  .catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
  });
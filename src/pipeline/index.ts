import { NotionExtractor } from '@/services/extractors/langchain/index.js';
import { EmbeddingService } from '@/services/embedding/index.js';
import { IndexingService } from '@/services/indexing/index.js';
import { AppError } from '@/utils/errors.js';
import { content } from '@/config/content.js';
import { keys, validateKeys } from '@/config/keys.js';
import ora from 'ora';

type Content = keyof typeof content;

export async function main(contentKey: Content) {
  const startTime = performance.now();
  
  const spinner = ora({
    text: 'Validating environment',
    color: 'yellow',
    indent: 2,
  });

  try {
    // Validate environment
    spinner.start('Validating configuration');
    validateKeys();
    const dbConfig = content[contentKey]?.notion?.id
      ? content[contentKey]
      : (() => {
          throw new AppError(`Invalid configuration for "${contentKey}"`, 'CONFIG_ERROR');
        })();
    spinner.succeed(`Configuration valid for content: \x1b[34m${contentKey}\x1b[0m`);

    // Extract documents
    spinner.start('Extracting from Notion');
    const notionExtractor = new NotionExtractor();
    const extractionResult = await notionExtractor.extract(
      dbConfig.notion.id,
      dbConfig.notion.docType,
      {
        onProgress: (current, total, title) => {
          spinner.text = `Extracting from Notion (${current}/${total}): ${title}`;
        }
      }
    );
    spinner.succeed(`Extracted \x1b[32m${extractionResult.documents.length}\x1b[0m documents`);

    // Generate embeddings
    spinner.start('Generating embeddings');
    const embeddingService = new EmbeddingService();
    const embeddingResult = await embeddingService.embedDocuments(extractionResult.documents, {
      onProgress: (current, total) => {
        spinner.text = `Generating embeddings (${current}/${total})`;
      },
    });
    spinner.succeed(`Generated \x1b[32m${embeddingResult.data.documents.length}\x1b[0m embeddings`);

    // Index documents
    spinner.start('Indexing documents');
    const indexingService = new IndexingService();
    const indexingResult = await indexingService.index({
      database: dbConfig.pinecone.index,
      namespace: dbConfig.pinecone.namespace || '',
      documents: embeddingResult.data.documents,
    });
    spinner.succeed(`Indexed \x1b[32m${indexingResult.totalDocuments}\x1b[0m documents`);

    const endTime = performance.now();
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(2);

    spinner.succeed(
      `\x1b[32mPipeline complete: \x1b[34m${contentKey}\x1b[0m in ${minutes}m ${seconds}s`
    );

    return {
      success: true,
      duration: `${minutes}m ${seconds}s`,
      data: {
        extraction: extractionResult,
        embedding: embeddingResult,
        indexing: indexingResult,
      },
    };
  } catch (error: unknown) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(2);

    spinner.fail(
      `Error after ${minutes}m ${seconds}s: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}
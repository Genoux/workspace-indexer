import { NotionExtractor } from '@/services/extractors/langchain/index.js';
import { EmbeddingService } from '@/services/embedding/index.js';
import { IndexingService } from '@/services/indexing/index.js';
import { AppError } from '@/utils/errors.js';
import { content } from '@/config/content.js';
import { validateKeys } from '@/config/keys.js';
import { performance } from 'perf_hooks';
import { Result, err, ok } from 'neverthrow';
import ora from 'ora';

type Content = keyof typeof content;

interface PipelineResult {
  success: boolean;
  duration: string;
  data?: {
    documentCount: number,
    indexName: string,
    namespace: string
  };
  error?: {
    code: string;
    message: string;
  };
}

function formatDuration(startTime: number): string {
  const duration = performance.now() - startTime;
  const minutes = Math.floor(duration / 60000);
  const seconds = ((duration % 60000) / 1000).toFixed(2);
  return `${minutes}m ${seconds}s`;
}

function validateConfig(contentKey: Content): Result<typeof content[Content], AppError> {
  if (!content[contentKey]?.notion?.id) {
    return err(new AppError(`Invalid configuration for "${contentKey}"`, 'CONFIG_ERROR'));
  }
  return ok(content[contentKey]);
}

export async function main(contentKey: Content): Promise<PipelineResult> {
  const startTime = performance.now();
  const spinner = ora({ text: 'Validating environment', color: 'yellow', indent: 2 });

  try {
    spinner.start('Validating configuration');
    validateKeys();

    const configResult = validateConfig(contentKey);
    if (configResult.isErr()) {
      throw configResult.error;
    }
    const config = configResult.value;

    spinner.succeed(`Configuration valid for content: \x1b[34m${contentKey}\x1b[0m`);

    // 1. Extract 
    spinner.start('Extracting from Notion');
    const notionExtractor = new NotionExtractor();
    const extractionResult = await notionExtractor.extract(config, {
      onProgress: (current, total, title) => {
        spinner.text = `Extracting from Notion (${current}/${total}): ${title}`;
      }
    });

    if (extractionResult.isErr()) {
      throw extractionResult.error;
    }
    spinner.succeed(`Extracted \x1b[32m${extractionResult.value.documentCount}\x1b[0m documents`);

    // 2. Embed
    spinner.start('Generating embeddings');
    const embeddingService = new EmbeddingService();
    const embeddingResult = await embeddingService.embedDocuments(
      extractionResult.value.documents,
      {
        onProgress: (current, total) => {
          spinner.text = `Generating embeddings (${current}/${total})`;
        }
      }
    );

    if (embeddingResult.isErr()) {
      throw embeddingResult.error;
    }
    spinner.succeed(`Generated \x1b[32m${embeddingResult.value.data.count}\x1b[0m embeddings`);

    // 3. Index
    spinner.start('Indexing documents');
    const indexingService = new IndexingService();
    const indexingResult = await indexingService.index(
      config,
      embeddingResult.value.data.documents
    );

    if (indexingResult.isErr()) {
      throw indexingResult.error;
    }

    const duration = formatDuration(startTime);
    spinner.succeed(`\x1b[32mPipeline complete: \x1b[34m${contentKey}\x1b[0m in ${duration}`);

    return {
      success: true,
      duration,
      data: {
        documentCount: indexingResult.value.totalDocuments,
        indexName: indexingResult.value.indexName,
        namespace: indexingResult.value.namespace
      }
    };

  } catch (error) {
    const duration = formatDuration(startTime);

    if (error instanceof AppError) {
      spinner.fail(`Error after ${duration}: ${error.message}`);
      return {
        success: false,
        duration,
        error: {
          code: error.code,
          message: error.message
        }
      };
    }

    spinner.fail(`Error after ${duration}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      duration,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
}
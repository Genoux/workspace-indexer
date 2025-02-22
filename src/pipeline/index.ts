import { NotionExtractor } from '@/services/extractors/index.js';
import { IndexingService } from '@/services/indexing/index.js';
import { EmbeddingService } from '@/services/embedding/index.js';
import { AppError } from '@/utils/errors.js';
import { documents } from '@/config/documents';
import { performance } from 'perf_hooks';
import ora from 'ora';
import _ from 'lodash';
import { validateEnv } from '@/config/env';
import { NotionChunk } from '@/types';

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
  const minutes = _.floor(duration / 60000);
  const seconds = _.round((duration % 60000) / 1000, 2);
  return `${minutes}m ${seconds}s`;
}

export async function main(documentName: string): Promise<PipelineResult> {


  const startTime = performance.now();
  const spinner = ora({ text: 'Starting pipeline', color: 'yellow', indent: 2 });

  try {
    // Validation
    spinner.start('Validating configuration');
    validateEnv();

    const config = documents[documentName];
    if (!config) {
      throw new AppError(`Document "${documentName}" not found`, 'CONFIG_ERROR');
    }
    spinner.succeed(`Configuration valid for document: ${documentName}`);

    const notionExtractor = new NotionExtractor(config);
    const embeddingService = new EmbeddingService();
    const indexingService = new IndexingService();

    // 1. Extraction
    spinner.start('Extracting from Notion');
    const extractionResult = await notionExtractor.extract(
      (current, total, title) => {
        spinner.text = `Extracting from Notion (${current}/${total}): ${title}`;
      }
    );

    if (extractionResult.isErr()) {
      throw extractionResult.error;
    }

    const { documents: extractedDocs, stats } = extractionResult.value;
    if (stats.totalRecords === 0) {
      throw new AppError('No documents to index', 'NO_DOCUMENTS');
    }
    spinner.succeed(`Extracted ${stats.totalDocs} pages into ${stats.totalRecords} chunks`);

    // 2. Embedding
    spinner.start('Generating embeddings');
    const embeddingResult = await embeddingService.embedDocuments(
      extractedDocs as NotionChunk[],
      (current, total) => {
        spinner.text = `Generating embeddings (${current}/${total})`;
      }
    );

    if (embeddingResult.isErr()) {
      throw embeddingResult.error;
    }
    spinner.succeed(`Generated embeddings for ${embeddingResult.value.length} chunks`);

    // 3. Indexing
    spinner.start('Indexing to Pinecone');
    const indexingResult = await indexingService.upsert(
      config.pinecone.index,
      config.pinecone.namespace,
      embeddingResult.value
    );

    if (indexingResult.isErr()) {
      throw indexingResult.error;
    }

    spinner.succeed(
      `Indexed ${indexingResult.value.count} chunks to Pinecone (${config.pinecone.index}/${config.pinecone.namespace})`
    );

    return {
      success: true,
      duration: formatDuration(startTime),
      data: {
        documentCount: indexingResult.value.count,
        indexName: config.pinecone.index,
        namespace: config.pinecone.namespace
      }
    };
  } catch (error) {
    const duration = formatDuration(startTime);

    if (error instanceof AppError) {
      spinner.fail(`Pipeline failed after ${duration}: ${error.message}`);
      return {
        success: false,
        duration,
        error: {
          code: error.code,
          message: error.message
        }
      };
    }

    spinner.fail(`Pipeline failed after ${duration}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
// src/pipeline.js
import { performance } from 'perf_hooks';
import ora from 'ora';
import _ from 'lodash';
import chalk from 'chalk';
import { err, ok } from 'neverthrow';
import { validateEnv } from '@/config/env.js';
import { NotionExtractor } from '@/services/extractors/index.js';
import { IndexingService } from '@/services/indexing/index.js';
import { EmbeddingService } from '@/services/embedding/index.js';
import { documents } from '@/config/documents.js';

function formatDuration(startTime: number): string {
  const duration = performance.now() - startTime;
  const minutes = _.floor(duration / 60000);
  const seconds = _.round((duration % 60000) / 1000, 2);
  return `${minutes}m ${seconds}s`;
}

export async function main(documentName: string) {
  const startTime = performance.now();
  const spinner = ora({ text: 'Starting pipeline', color: 'yellow', indent: 2 });

  try {
    // Step 1: Validate environment variables
    const envResult = validateEnv();
    if (envResult.isErr()) {
      spinner.fail(`Environment validation failed`);
      return err(new Error(`${envResult.error}`));
    }

    const config = documents[documentName];
    if (!config) {
      spinner.fail(`Document "${documentName}" not found in configuration`);
      return err(`Document "${documentName}" not found`);
    }
    spinner.succeed(`Configuration valid for document: ${documentName}`);

    const notionExtractor = new NotionExtractor(config);
    const embeddingService = new EmbeddingService();
    const indexingService = new IndexingService();

    // 1. Extraction with progress
    spinner.start('Extracting from Notion');
    const extractionResult = await notionExtractor.extract((progress) => {
      spinner.text = progress.message;
    });

    if (extractionResult.isErr()) {
      spinner.fail(`Extraction failed`);
      return err(new Error(`${extractionResult.error}`));
    }

    const { documents: docsToProcess, stats } = extractionResult.value;

    spinner.succeed(
      `Extracted ${stats.totalDocs}/${stats.totalChunks} pages/chunks (${stats.processedDocs > 0 ? chalk.green(stats.processedDocs) : 0} new, ${chalk.yellow(stats.cachedDocs)} cached)`
    );

    if (docsToProcess.length === 0) {
      spinner.succeed(`All ${stats.totalChunks} chunks are already embedded and indexed`);

      return ok({
        success: true,
        duration: formatDuration(startTime),
        data: {
          documentCount: 0,
          totalCount: stats.totalChunks,
          skippedCount: stats.totalChunks,
          indexName: config.pinecone.index,
          namespace: config.pinecone.namespace,
        },
      });
    }

    // 2. Embedding - only for new documents that need processing
    spinner.start(`Generating embeddings for ${chalk.green(docsToProcess.length)} chunks`);
    const embeddingResult = await embeddingService.embedDocuments(docsToProcess, (progress) => {
      spinner.text = progress.message;
    });

    if (embeddingResult.isErr()) {
      spinner.fail(`Embedding failed`);
      return err(new Error(`${embeddingResult.error}`));
    }

    spinner.succeed(`Generated embeddings for ${embeddingResult.value.length} chunks`);

    // 3. Indexing with progress - only for newly embedded docs
    spinner.start(`Indexing ${embeddingResult.value.length} chunks to Pinecone`);
    const indexingResult = await indexingService.upsert(
      config.pinecone.index,
      config.pinecone.namespace,
      embeddingResult.value,
      (progress) => {
        spinner.text = progress.message;
      }
    );

    if (indexingResult.isErr()) {
      spinner.fail(`Indexing failed`);
      return err(new Error(`${indexingResult.error}`));
    }

    spinner.succeed(
      `Indexed ${chalk.blue(indexingResult.value.count)} chunks to Pinecone at ${chalk.cyan(config.pinecone.index)}/${chalk.cyan(config.pinecone.namespace)}`
    );

    return ok({
      success: true,
      duration: formatDuration(startTime),
      data: {
        documentCount: indexingResult.value.count,
        totalCount: stats.totalChunks,
        skippedCount: stats.totalChunks - docsToProcess.length,
        indexName: config.pinecone.index,
        namespace: config.pinecone.namespace,
      },
    });
  } catch (error) {
    return err(new Error(`${error}`));
  }
}

import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { keys } from '@/config/keys.js';
import type { Config } from '@/config/content.js';
import { Result, err, ok } from 'neverthrow';
import { AppError } from '@/utils/errors.js';

export type ExtractionResult = {
  status: string;
  documentCount: number;
  sourceId: string;
  type: string;
  documents: Document[];
};

export class NotionExtractor {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n---\n', '\n# ', '\n## ', '\n### ', '\n\n', '\n'],
    });
  }

  async extract(
    config: Config,
    options?: {
      onProgress?: (current: number, total: number, title: string) => void
    }
  ): Promise<Result<ExtractionResult, AppError>> {
    const { id, docType } = config.notion;
    const loader = new NotionAPILoader({
      clientOptions: {
        auth: keys.notion.apiKey,
        notionVersion: "2022-06-28",
      },
      id,
      type: docType,
      onDocumentLoaded: (current, total, currentTitle) => {
        if (currentTitle && options?.onProgress) {
          options.onProgress(current, total, currentTitle);
        }
      },
      propertiesAsHeader: true,
    });

    try {
      const docs = await loader.load();
      const processedDocsResult = await this.processDocuments(docs, options?.onProgress);
      
      if (processedDocsResult.isErr()) {
        return err(processedDocsResult.error);
      }

      return ok({
        status: 'success',
        documentCount: processedDocsResult.value.length,
        sourceId: id,
        type: docType,
        documents: processedDocsResult.value,
      });
    } catch (error) {
      const message = error instanceof AggregateError 
        ? error.errors[0]?.message 
        : error instanceof Error ? error.message : 'Failed to load from Notion';
        
      return err(new AppError(message, 'ERROR_LOADING_NOTION_DOCS'));
    }
  }

  private async processDocuments(
    docs: Document[],
    onProgress?: (current: number, total: number, title: string) => void
  ): Promise<Result<Document[], AppError>> {
    if (!docs?.length) {
      return err(new AppError('No documents to process', 'NO_DOCUMENTS_FOUND'));
    }

    if (onProgress) {
      onProgress(0, docs.length, 'Starting document processing');
    }

    try {
      const splitDocs = await this.textSplitter.splitDocuments(docs);
      
      return ok(splitDocs.map((chunk, index) => {
        if (onProgress) {
          onProgress(index + 1, splitDocs.length, 'Processing chunks');
        }

        return new Document({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            chunkIndex: index,
            totalChunks: splitDocs.length,
          },
        });
      }));
    } catch (error) {
      return err(new AppError(
        error instanceof Error ? error.message : 'Failed to process documents',
        'DOCUMENT_PROCESSING_ERROR'
      ));
    }
  }
}
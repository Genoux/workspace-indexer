import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Result, err, ok } from 'neverthrow';
import { AppError } from '@/utils/errors.js';
import { keys } from '@/config/keys.js';
import type { Config } from '@/types';

interface ExtractedDocument {
  id: string;
  content: string;
  metadata: {
    title: string;
    sourceId: string;
    created_time: string;
    last_edited_time: string;
    url?: string;
    properties?: Record<string, any>;
  }
}

interface ExtractionResult {
  status: string;
  documentCount: number;
  sourceId: string;
  type: 'page' | 'database';
  documents: ExtractedDocument[];
}

export class NotionExtractor {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n---\n', '\n# ', '\n## ', '\n### ', '\n\n', '\n'],
    });
  }

  private transformDocument(doc: any, sourceId: string, index: number): ExtractedDocument {
    const isDatabase = doc.metadata.parent?.type === 'database_id';
    
    if (isDatabase) {
      const properties = doc.metadata.properties || {};
      const content = Object.entries(properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      return {
        id: `${sourceId}-${index}`,
        content,
        metadata: {
          title: properties._title || properties.Name || `Document ${index}`,
          sourceId,
          created_time: doc.metadata.created_time,
          last_edited_time: doc.metadata.last_edited_time,
          url: doc.metadata.url,
          properties
        }
      };
    }

    return {
      id: `${sourceId}-${index}`,
      content: doc.pageContent,
      metadata: {
        title: doc.metadata.title || `Document ${index}`,
        sourceId,
        created_time: doc.metadata.created_time,
        last_edited_time: doc.metadata.last_edited_time,
        url: doc.metadata.url
      }
    };
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
      }
    });

    try {
      const docs = await loader.load();
      if (!docs?.length) {
        return err(new AppError('No documents found in Notion', 'NO_DOCUMENTS_FOUND'));
      }

      const processedDocs = await this.textSplitter.splitDocuments(docs);
      const documents = processedDocs.map((doc, index) => 
        this.transformDocument(doc, id, index)
      );

      return ok({
        status: 'success',
        documentCount: documents.length,
        sourceId: id,
        type: docType,
        documents
      });
    } catch (error) {
      const message = error instanceof AggregateError
        ? error.errors[0]?.message
        : error instanceof Error ? error.message : 'Failed to load from Notion';
      return err(new AppError(message, 'ERROR_LOADING_NOTION_DOCS'));
    }
  }
}
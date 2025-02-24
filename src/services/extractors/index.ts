// extractors/index.ts
import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Result, err, ok } from 'neverthrow';
import { AppError } from '@/utils/errors.js';
import { ProgressCallback, NotionChunk, DocumentConfig } from '@/types';
import { env } from '@/config/env.js';
import { formatNotionContent } from './helpers';

interface NotionRecord {
  pageTitle: string;
  text: string;
  pageId: string;
  pageType: string;
  pageUrl: string;
  lastUpdated: string;
}

interface ExtractionStats {
  totalDocs: number;
  totalRecords: number;
  averageSize: number;
}

interface ExtractionResult {
  documents: NotionRecord[];
  stats: ExtractionStats;
}

export class NotionExtractor {
  constructor(private config: DocumentConfig) { }

  private readonly splitter = new RecursiveCharacterTextSplitter({
    separators: [
      "\n---\n",
      "\n\n",
      "\n",
    ],
    chunkSize: 1000,
    chunkOverlap: 200,
    lengthFunction: (text: string) => {
      // Replace URLs with a fixed-length placeholder before counting
      return text
        .replace(/https?:\/\/[^\s\n]+/g, 'URL')  // Regular URLs
        .replace(/\?X-Amz[^\s\n]+/g, 'S3URL')    // S3 URLs with query params
        .length;
    }
  });

  private createChunkedRecord(doc: Document, chunkIndex: number, totalChunks: number): NotionChunk {
  const { properties, notionId, url, last_edited_time } = doc.metadata;
    const docType = this.config.notion.docType;
    const text = formatNotionContent(doc, docType);
  return {
    pageTitle: properties._title,
    text,
    pageId: `${notionId}_chunk_${chunkIndex}`,
    parentId: notionId,
    pageType: docType,
    pageUrl: url,
    lastUpdated: last_edited_time,
    chunkIndex,
    totalChunks,
  };
}

  async extract(
    onProgress: ProgressCallback
  ): Promise<Result<ExtractionResult, AppError>> {
    try {
      const docs = await this.loadDocuments(onProgress);
      if (!docs?.length) {
        return err(new AppError('No documents found', 'NO_DOCUMENTS_FOUND'));
      }

      const records: NotionChunk[] = [];
      
      for (const doc of docs) {
        const chunks = await this.splitter.splitDocuments([doc]);
        const chunkedRecords = chunks.map((chunk, idx) => 
          this.createChunkedRecord(chunk, idx, chunks.length)
        );
        records.push(...chunkedRecords);
      }

      const stats = {
        totalDocs: docs.length,
        totalRecords: records.length,
        averageSize: Math.round(
          records.reduce((sum, record) => sum + record.text.length, 0) /
          records.length
        )
      };

      return ok({ documents: records, stats });
    } catch (error) {
      return err(new AppError(
        error instanceof Error ? error.message : 'Failed to extract documents',
        'EXTRACTION_ERROR'
      ));
    }
  }

  private async loadDocuments(onProgress: ProgressCallback): Promise<Document[]> {
    const loader = new NotionAPILoader({
      clientOptions: {
        auth: env.NOTION_API_KEY,
        notionVersion: "2022-06-28",
      },
      id: this.config.notion.id,
      type: this.config.notion.docType,
      onDocumentLoaded: (current, total, currentTitle) => {
        onProgress?.(current, total, currentTitle ?? '');
      }
    });

    return loader.load();
  }
}
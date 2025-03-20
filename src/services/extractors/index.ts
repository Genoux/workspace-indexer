// src/services/extractors/index.ts
import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { type Result, err, ok } from 'neverthrow';
import type { NotionChunk, DocumentConfig, ProgressCallback } from '@/types';
import { env } from '@/config/env.js';
import { formatDocumentContent } from './formatter.js';
import { summarizeDocument } from './summarizer.js';
import { internalCache } from './cache.js';

interface ExtractionStats {
  totalDocs: number;
  processedDocs: number;
  cachedDocs: number;
  totalChunks: number;
  newChunks: number;
}

interface ExtractionResult {
  documents: NotionChunk[];
  stats: ExtractionStats;
}

export class NotionExtractor {
  private cachedDocIds = new Set<string>();

  constructor(private config: DocumentConfig) { }

  private readonly splitter = new RecursiveCharacterTextSplitter({
    separators: ["\n---\n", "\n\n", "\n"],
    chunkSize: 1000,
    chunkOverlap: 200,
    lengthFunction: (text) => text
      .replace(/https?:\/\/[^\s\n]+/g, 'URL')
      .replace(/\?X-Amz[^\s\n]+/g, 'S3URL')
      .length
  });

  async extract(onProgress?: ProgressCallback): Promise<Result<ExtractionResult, Error>> {
    try {
      this.cachedDocIds.clear();

      const docsResult = await this.loadDocuments((current, total, title) => {
        onProgress?.({
          stage: 'extraction',
          percent: 5 + Math.floor((current / total) * 20),
          message: `Loading document ${current}/${total}: ${title || 'Untitled'}`
        });
      });

      if (docsResult.isErr()) {
        return err(new Error(`Failed to load documents: ${docsResult.error}`));
      }

      const docs = docsResult.value;
      if (!docs?.length) {
        return err(new Error('No documents found'));
      }

      const { allChunks, newChunks } = await this.processDocuments(docs, onProgress);

      return ok({
        documents: newChunks,
        stats: {
          totalDocs: docs.length,
          processedDocs: docs.length - this.cachedDocIds.size,
          cachedDocs: this.cachedDocIds.size,
          totalChunks: allChunks.length,
          newChunks: newChunks.length
        }
      });
    } catch (error) {
      return err(new Error(`Failed to extract documents: ${error}`));
    }
  }

  private async loadDocuments(
    onDocumentLoaded?: (current: number, total: number, title?: string) => void
  ): Promise<Result<Document[], Error>> {
    try {
      const loader = new NotionAPILoader({
        clientOptions: {
          auth: env.NOTION_API_KEY,
          notionVersion: "2022-06-28",
        },
        id: this.config.notion.id,
        type: this.config.notion.docType,
        onDocumentLoaded
      });

      const docs = await loader.load();
      return ok(docs);
    } catch (error) {
      return err(new Error(`Failed to load documents: ${error}`));
    }
  }

  private async processDocuments(
    docs: Document[],
    onProgress?: ProgressCallback
  ): Promise<{ allChunks: NotionChunk[]; newChunks: NotionChunk[] }> {
    const allChunks: NotionChunk[] = [];
    const newChunks: NotionChunk[] = [];

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const chunks = await this.processDocument(doc);

      if (chunks.isOk() && chunks.value.length > 0) {
        allChunks.push(...chunks.value);

        if (!this.cachedDocIds.has(doc.metadata.notionId)) {
          newChunks.push(...chunks.value);
        }
      }

      onProgress?.({
        stage: 'extraction',
        percent: 25 + Math.floor((i + 1) / docs.length * 70),
        message: `Processing document ${i + 1}/${docs.length} (${this.cachedDocIds.size} from cache)`
      });
    }

    return { allChunks, newChunks };
  }

  private async processDocument(doc: Document): Promise<Result<NotionChunk[], Error>> {
    const { notionId, url, last_edited_time, properties } = doc.metadata;
    const { docType, summarizePrompt } = this.config.notion;
    const title = properties._title;

    const cacheKey = `doc_${notionId}_${last_edited_time}`;
    const cachedChunksResult = await internalCache.get<NotionChunk[]>(cacheKey);

    if (cachedChunksResult.isOk() && cachedChunksResult.value) {
      this.cachedDocIds.add(notionId);
      return ok(cachedChunksResult.value);
    }

    // Process document if not cached
    const chunks = await this.splitter.splitDocuments([doc]);
    const processedChunks: NotionChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const content = formatDocumentContent(chunk, docType);

      const formattedDoc = new Document({
        pageContent: content,
        metadata: chunk.metadata
      });

      const summaryResult = await summarizeDocument(formattedDoc, summarizePrompt);
      if (summaryResult.isErr()) {
        return err(new Error(`Failed to summarize document ${notionId}: ${summaryResult.error}`));
      }

      processedChunks.push({
        pageTitle: title,
        text: content,
        summary: summaryResult.value,
        pageId: `${notionId}_chunk_${i}`,
        parentId: notionId,
        pageType: docType,
        pageUrl: url,
        lastUpdated: last_edited_time,
        chunkIndex: i,
        totalChunks: chunks.length
      });
    }

    // // Store in cache
    // const setCacheResult = await internalCache.set(cacheKey, processedChunks);
    // if (setCacheResult.isErr()) {
    //   return err(new Error(`Failed to cache document ${notionId}: ${setCacheResult.error.message}`));
    // }

    return ok(processedChunks);
  }
}
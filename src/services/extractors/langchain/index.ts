// src/services/extractors/notion/index.ts
import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { logger } from '@/utils/logger';
import { CONFIG } from '@/config';

export class LangChainNotionExtractor {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: [
        '\n---\n',
        '\n# ',
        '\n## ',
        '\n### ',
        '\n\n',
        '\n',
        '. ',
        '! ',
        '? ',
        ', ',
        ' ',
        '',
      ],
    });
  }

  async extract(id: string, type: 'database' | 'page') {
    logger.info({ id, type }, '🚀 Starting Notion extraction');

    try {
      const loader = new NotionAPILoader({
        clientOptions: { auth: CONFIG.notion.apiKey },
        id,
        type,
        onDocumentLoaded: (current, total, currentTitle) => {
          logger.info(`Loaded: ${currentTitle} (${current}/${total})`);
        },
        callerOptions: {
          maxConcurrency: 64,
        },
        propertiesAsHeader: true,
      });

      const docs = await loader.load();
      const processedDocs = await this.processDocuments(docs, id, type);

      return {
        status: 'success',
        documentCount: processedDocs.length,
        sourceId: id,
        type,
        documents: processedDocs,
      };
    } catch (error) {
      logger.error({ id, type, error }, 'Extraction failed');
      throw error;
    }
  }

  private async processDocuments(
    docs: Document[],
    sourceId: string,
    type: 'database' | 'page',
  ): Promise<Document[]> {
    const splitDocs = await this.textSplitter.splitDocuments(docs);

    return splitDocs.map(
      (chunk: { metadata: any; pageContent: string }, index: number) =>
        new Document({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            sourceId,
            sourceType: type,
            timestamp: new Date().toISOString(),
            chunkIndex: index,
            totalChunks: splitDocs.length,
          },
        }),
    );
  }
}

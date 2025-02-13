import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { logger } from '@/utils/logger';
import { keys } from '@/config';

export class NotionExtractor {
  private readonly textSplitter: RecursiveCharacterTextSplitter;
  private readonly lastKnowledgeUpdated: string;

  constructor(lastKnowledgeUpdated: string = new Date().toISOString()) {
    this.lastKnowledgeUpdated = lastKnowledgeUpdated;
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
    const loader = new NotionAPILoader({
      clientOptions: {
        auth: keys.notion.apiKey,
        notionVersion: '2022-06-28',
      },
      id,
      type,
      onDocumentLoaded: (current, total, currentTitle) => {
        logger.info(`📜 Loaded: ${currentTitle} (${current}/${total})`);
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
  }

  private async processDocuments(
    docs: Document[],
    sourceId: string, 
    type: 'database' | 'page'
  ): Promise<Document[]> {
    const splitDocs = await this.textSplitter.splitDocuments(docs);
    
    return splitDocs.map((chunk, index) => new Document({
      pageContent: chunk.pageContent,
      metadata: {
        ...chunk.metadata,
        sourceId,
        sourceType: type,
        timestamp: new Date().toISOString(),
        chunkIndex: index,
        totalChunks: splitDocs.length,
        lastKnowledgeUpdated: this.lastKnowledgeUpdated,
      },
    }));
  }
}

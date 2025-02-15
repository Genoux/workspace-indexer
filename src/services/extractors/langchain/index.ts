import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { keys } from '@/config/keys.js';
import { writeToFile } from '@/utils/writer.js';
// In NotionExtractor class:
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
    id: string,
    type: 'database' | 'page',
    options?: {
      onProgress?: (current: number, total: number, title: string) => void
    }
  ) {
    const loader = new NotionAPILoader({
      clientOptions: {
        auth: keys.notion.apiKey,
        notionVersion: "2022-06-28",
      },
      id,
      type,
      onDocumentLoaded: (current, total, currentTitle) => {
        if (currentTitle && options?.onProgress) {
          options.onProgress(current, total, currentTitle);
        }
      },
      propertiesAsHeader: true,
    });

    const docs = await loader.load();
    
    const processedDocs = await this.processDocuments(docs, options?.onProgress);
    
    await writeToFile('extractionResult.json', JSON.stringify(processedDocs, null, 2));
    
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
    onProgress?: (current: number, total: number, title: string) => void
  ): Promise<Document[]> {
    if (onProgress) {
      onProgress(0, docs.length, 'Starting document processing');
    }

    const splitDocs = await this.textSplitter.splitDocuments(docs);

    return splitDocs.map((chunk, index) => {
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
    });
  }
}

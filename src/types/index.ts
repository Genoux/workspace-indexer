export interface DocumentConfig {
  notion: {
    id: string;
    docType: 'page' | 'database';
    docDescription: string;
  };
  pinecone: {
    index: string;
    namespace: string;
  };
}

export interface ProgressCallback {
  (current: number, total: number, title: string): void;
}


export interface NotionRecord {
  pageTitle: string;
  text: string;
  pageId: string;
  pageType: string;
  pageUrl: string;
  lastUpdated: string;
}

export interface NotionChunk extends NotionRecord {
  chunkIndex: number;
  totalChunks: number;
  parentId: string;
}
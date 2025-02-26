export interface ProgressEvent {
  stage: string;
  percent: number;
  detail?: Record<string, object>;
}

export type ProgressCallback = (progress: ProgressUpdate) => void;

export interface ProgressUpdate {
  stage: string;
  percent: number;
  message: string;
}

export interface NotionChunk {
  pageTitle: string;
  text: string;
  pageId: string;
  parentId: string;
  pageType: 'page' | 'database';
  pageUrl: string;
  lastUpdated: string;
  chunkIndex: number;
  totalChunks: number;
}

export interface DocumentConfig {
  notion: {
    id: string;
    docType: 'page' | 'database';
    summarizePrompt?: string;
  };
  pinecone: {
    index: string;
    namespace: string;
  };
}

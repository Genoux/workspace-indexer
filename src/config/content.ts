interface Config {
  notion: {
    id: string;
    docType: 'database' | 'page';
  };
  pinecone: {
    index: string;
    namespace?: string;
  };
}

export const content: Record<string, Config> = {
  "creators": {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATORS!,
      docType: 'database',
    },
    pinecone: {
      index: 'notion-knowledge-base', 
      namespace: 'creators',
    },
  },
  "planets": {
    notion: {
      id: process.env.NOTION_DOC_ID__PLANETS!,
      docType: 'database',
    },
    pinecone: {
      index: 'planets',
    },
  }
} as const;

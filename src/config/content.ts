// src/config/databases.ts

interface config {
  notion: {
    id: string;
    docType: 'database' | 'page';
  };
  pinecone: {
    index: string;
  };
}

export const content: Record<string, config> = {
  creators: {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATORS!,
      docType: 'database',
    },
    pinecone: {
      index: 'creators',
    },
  },
  planets: {
    notion: {
      id: '198a9e8a2ea380488f0df11020e0c88f',
      docType: 'page',
    },
    pinecone: {
      index: 'planets',
    },
  },
} as const;

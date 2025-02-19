export interface Config {
  notion: {
    id: string;
    docType: 'database' | 'page';
    docDescription?: string;
  };
  pinecone: {
    index: string;
    namespace: string;
  };
}

export const content: Record<string, Config> = {
  "creators": {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATORS!,
      docType: 'database',
      docDescription: 'This knowledge base represents a Notion UGC Creator Database used by inBeat for managing user-generated content partnerships. The database structure captures creator details across multiple dimensions: content performance metrics, quality ratings, language capabilities, and demographic data. This structured information helps understand creator profiles, their content capabilities, and performance history for effective UGC campaign management.',
    },
    pinecone: {
      index: 'notion-knowledge-base',
      namespace: 'creators',
    },
  },
  "creator-faq": {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATOR_FAQ!,
      docType: 'page',
      docDescription: 'A collection of answers to frequently asked questions about content creation, including explanations of hooks, scripts, ad code generation, and common contract clarifications.',
    },
    pinecone: {
      index: 'notion-knowledge-base',
      namespace: 'creator-faq',
    },
  }
} as const;

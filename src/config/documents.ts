import type { DocumentConfig } from '@/types';

export const documents: Record<string, DocumentConfig> = {
  'creator-faq': {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATOR_FAQ ?? '',
      docType: 'page',
    },
    pinecone: {
      index: 'inbeat-workspace',
      namespace: 'creator-faq',
    },
  },
} as const;

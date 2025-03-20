import type { DocumentConfig } from '@/types';
import { prompt } from '@/config/prompt.js';

export const documents: Record<string, DocumentConfig> = {
  'creator-faq': {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATOR_FAQ ?? '',
      docType: 'page',
      summarizePrompt: prompt['creator-faq'].summary,
    },
    pinecone: {
      index: 'inbeat-knowledge',
      namespace: 'creator-faq',
    },
  },
} as const;

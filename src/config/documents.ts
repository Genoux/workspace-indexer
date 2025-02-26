import type { DocumentConfig } from '@/types';
import { prompt } from '@/config/prompt.js';

export const documents: Record<string, DocumentConfig> = {
  creators: {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATORS!,
      docType: 'database',
      summarizePrompt: prompt.creators.summary,
    },
    pinecone: {
      index: 'knowledge-base',
      namespace: 'creators',
    },
  },
  'database-field-definitions': {
    notion: {
      id: process.env.NOTION_DOC_ID__DATABASE_FIELD_DEFINITIONS!,
      docType: 'page',
    },
    pinecone: {
      index: 'knowledge-base',
      namespace: 'database-field-definitions',
    },
  },
  'creator-faq': {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATOR_FAQ!,
      docType: 'page',
      summarizePrompt: prompt['creator-faq'].summary,
    },
    pinecone: {
      index: 'knowledge-base',
      namespace: 'creator-faq',
    },
  },
  'sample-creator': {
    notion: {
      id: process.env.NOTION_DOC_ID__SAMPLE_CREATOR!,
      docType: 'database',
      summarizePrompt: prompt['sample-creator'].summary,
    },
    pinecone: {
      index: 'knowledge-base',
      namespace: 'sample-creator',
    },
  },
} as const;

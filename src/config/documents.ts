import type { DocumentConfig } from '@/types';

export const documents: Record<string, DocumentConfig> = {
  "creators": {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATORS!,
      docType: 'database',
      docDescription: 'This knowledge base represents a Notion UGC Creator Database used by inBeat for managing user-generated content partnerships. The database structure captures creator details across multiple dimensions: content performance metrics, quality ratings, language capabilities, and demographic data. This structured information helps understand creator profiles, their content capabilities, and performance history for effective UGC campaign management.',
    },
    pinecone: {
      index: 'knowledge-base',
      namespace: 'creators',
    },
  },
  "database-field-definitions": {
    notion: {
      id: process.env.NOTION_DOC_ID__DATABASE_FIELD_DEFINITIONS!,
      docType: 'page',
      docDescription: 'Comprehensive Database Field Definitions and Documentation: A detailed guide to understanding and properly utilizing the various data fields within our database system. This reference document outlines the structure, purpose, and proper usage of each field to ensure consistent data entry and management across our platform.',
    },
    pinecone: {
      index: 'knowledge-base',
      namespace: 'database-field-definitions',
    },
  },
  "creator-faq": {
    notion: {
      id: process.env.NOTION_DOC_ID__CREATOR_FAQ!,
      docType: 'page',
      docDescription: 'A collection of answers to frequently asked questions about content creation, including explanations of hooks, scripts, ad code generation, and common contract clarifications.',
    },
    pinecone: {
      index: 'knowledge-base',
      namespace: 'creator-faq',
    },
  },
  "single-creator": {
    notion: {
      id: process.env.NOTION_DOC_ID_SINGLE_CREATOR!,
      docType: 'database',
      docDescription: 'A single creator page for testing purposes.',
    },
    pinecone: {
      index: 'knowledge-base',
      namespace: 'single-creator',
    },
  },
} as const;

// src/config/databases.ts
export const content = {
  creators: {
    notionId: process.env.NOTION_DOC_ID__CREATORS!,
    pineconeIndex: 'creators',
    type: 'database',
  },
  'General onboarding': {
    notionId: process.env.NOTION_DOC_ID__INBEAT_AI!,
    pineconeIndex: 'creators',
    type: 'page',
  },
} as const;

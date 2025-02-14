// src/config/index.ts
import { AppError } from '@/utils/errors.js';
import { config } from 'dotenv';
config();

interface ApiKeys {
  notion: { apiKey: string };
  pinecone: { apiKey: string };
  openai: { apiKey: string };
}

export const keys: ApiKeys = {
  notion: {
    apiKey: process.env.NOTION_API_KEY ?? '',
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY ?? '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  }
};

export const validateKeys = () => {
  const missingKeys = Object.entries(keys)
    .flatMap(([category, values]) => 
      Object.entries(values)
        .filter(([value]) => !value)
        .map(([key]) => `${category}.${key}`)
    );

  if (missingKeys.length > 0) {
    throw new AppError(
      `Missing required API keys: ${missingKeys.join(', ')}`,
      'CONFIG_ERROR'
    );
  }

  return true;
};
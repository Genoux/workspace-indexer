// src/config/index.ts
import { config } from 'dotenv';
config();

import { logger } from '../utils/logger';
import { AppError, handleError } from '../utils/errors';

export const keys = {
  notion: {
    apiKey: process.env.NOTION_API_KEY ?? '',
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY ?? '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
} as const;

try {
  Object.entries(keys).forEach(([category, values]) => {
    logger.info(`Checking ${category} configuration...`);

    Object.entries(values).forEach(([key, value]) => {
      if (!value) {
        throw new AppError(`${category} configuration is missing ${key}`);
      }
    });
  });

  logger.info('🔑 Configuration validated successfully');
} catch (error) {
  handleError(error);
}

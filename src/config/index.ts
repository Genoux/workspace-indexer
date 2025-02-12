// src/config/index.ts
import { config } from 'dotenv';
config();

import { logger } from '../utils/logger';
import { ConfigError, handleError } from '../utils/errors';

export const CONFIG = {
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
  Object.entries(CONFIG).forEach(([category, values]) => {
    logger.info(`Checking ${category} configuration...`);

    Object.entries(values).forEach(([key, value]) => {
      if (!value) {
        throw new ConfigError(category, key);
      }
    });
  });

  logger.info('🔑 Configuration validated successfully');
} catch (error) {
  handleError(error);
}

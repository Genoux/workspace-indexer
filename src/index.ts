// src/index.ts
import { config } from 'dotenv';
config();
import { main } from './pipeline/index.js';
import { logger } from './utils/logger.js';
import { content } from './config/content.js';
import { AppError } from './utils/errors.js';

type Database = keyof typeof content;
const dbName = process.argv[2] as Database;

if (!dbName || !(dbName in content)) {
  logger.error({
    code: 'INVALID_DATABASE',
    message: `Please provide a valid database name: ${Object.keys(content).join(', ')}`
  });
  process.exit(1);
}

(async () => {
  try {
    await main(dbName);
    process.exit(0);
  } catch (error) {
    logger.error({
      code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    process.exit(1);
  }
})();
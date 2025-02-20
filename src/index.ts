import { config } from 'dotenv';
config();
import { main } from '@/pipeline/index.js';
import { content } from '@/config/content.js';
import { logger } from '@/utils/logger.js';

type Database = keyof typeof content;

process.on('SIGINT', () => {
  logger.info('\nGracefully shutting down...');
  process.exit(0);
});

(async () => {
  const dbName = process.argv[2] as Database;
  
  if (!dbName || !(dbName in content)) {
    logger.error(`Please provide a valid database name: ${Object.keys(content).join(', ')}`);
    process.exit(1);
  }

  try {
    const result = await main(dbName);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Pipeline error:', error);
    process.exit(1);
  }
})();
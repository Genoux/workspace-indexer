import { config } from 'dotenv';
config();
import { main } from '@/pipeline/index.js';
import { documents } from '@/config/documents.js';
import { logger } from '@/utils/logger.js';

process.on('SIGINT', () => {
  logger.info('SIGINT received, exiting...');
  process.exit(0);
});

(async () => {
  const documentName = process.argv[2];
  if (!documentName || !(documentName in documents)) {
    logger.error(`Please provide a valid document name: ${Object.keys(documents).join(', ')}`);
    process.exit(1);
  }
  
  try {
    const result = await main(documentName);
    if (result.isErr()) {
      logger.error(`${result.error}`);
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error(`${error}`);
    process.exit(1);
  }
})();
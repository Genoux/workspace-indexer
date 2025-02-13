// src/index.ts
import { main } from '@/pipeline';
import { logger } from '@/utils/logger';
import { content } from '@/config/content';
import { AppError } from './utils/errors';

type Database = keyof typeof content;

if (require.main === module) {
  const args = process.argv.slice(2);
  const dbArg = args.find((arg) => arg.startsWith('--db='));
  const dbName = dbArg ? dbArg.split('=')[1] : 'planets';

  (async () => {
    try {
      await main(dbName as Database);
      logger.info('✨ Process completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error({
        code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      process.exit(1);
    }
  })();
}
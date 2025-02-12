// src/index.ts
import { main } from '@/pipeline';
import { logger } from '@/utils/logger';
import { content } from '@/config/content';

type Database = keyof typeof content;

if (require.main === module) {
  const args = process.argv.slice(2);
  const dbArg = args.find((arg) => arg.startsWith('--db='));
  const dbName = dbArg ? dbArg.split('=')[1] : 'creators';

  logger.info(`Using database: ${dbName}`);

  (async () => {
    try {
      const result = await main(dbName as Database);
      if (result.success) {
        logger.info('✅ Extraction completed successfully');
      } else {
        logger.error('❌ Extraction failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      logger.error('Failed to execute:', error);
      process.exit(1);
    }
  })();
}

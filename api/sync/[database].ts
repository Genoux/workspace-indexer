// api/extract/[database].ts (API endpoint)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { main } from '../../src/pipeline';
import { content } from '../../src/config/content';
import { logger } from '../../src/utils/logger';

type Database = keyof typeof content;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const database = req.query.database as Database;
  logger.info('Starting API execution for database:', database);

  try {
    const result = await main(database);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('API execution failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    });
  }
}
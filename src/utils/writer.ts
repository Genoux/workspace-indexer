import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { Result, err, ok } from 'neverthrow';
import { AppError } from './errors.js';

interface WriteOptions {
  silent?: boolean;
}

export const writeToFile = async (
  content: string,
  fileName: string,
  options: WriteOptions = {}
): Promise<Result<string, AppError>> => {
  try {
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, fileName);
    await fs.promises.writeFile(filePath, content, 'utf-8');

    if (!options.silent) {
      logger.debug(`📝 File written: ${filePath}`);
    }

    return ok(filePath);
  } catch (error) {
    logger.error(`Failed to write ${fileName}: ${error}`);
    return err(new AppError(
      error instanceof Error ? error.message : 'Failed to write file',
      'FILE_WRITE_ERROR'
    ));
  }
};

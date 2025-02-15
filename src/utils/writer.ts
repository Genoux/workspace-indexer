import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

interface WriteOptions {
  silent?: boolean;
}

/**
 * Writes content to a file in the output directory
 * @param fileName Name of the file to create
 * @param content Content to write to the file
 * @param options Configuration options
 */
export const writeToFile = async (
  fileName: string,
  content: string,
  options: WriteOptions = {}
): Promise<string> => {
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

    return filePath;
  } catch (error) {
    logger.error(`Failed to write ${fileName}: ${error}`);
    throw error;
  }
};

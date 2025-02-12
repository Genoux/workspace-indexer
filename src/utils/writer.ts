import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Writes content to a file in the output directory
 * @param fileName Name of the file to create
 * @param content Content to write to the file
 */
export const writeToFile = async (
  fileName: string,
  content: string,
): Promise<void> => {
  try {

    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, fileName);

    await fs.promises.writeFile(filePath, content, 'utf-8');

    logger.info(`📝 Successfully wrote to file: ${filePath}`);
  } catch (error) {
    logger.error(`Error writing to file ${fileName}: ${error}`);
    throw error;
  }
};

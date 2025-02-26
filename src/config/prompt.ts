import { parse } from 'yaml';
import { readFile } from 'fs/promises';
import path from 'path';
import { logger } from '@/utils/logger.js';
import { fileURLToPath } from 'url';

export interface PromptConfig {
  [key: string]: {
    [key: string]: string
  }
}

const defaultPrompts: PromptConfig = {
  creators: {
    summary: "Default creator summary prompt (placeholder)",
  },
};

export const prompt = await (async (): Promise<PromptConfig> => {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const promptsYaml = await readFile(
      path.resolve(__dirname, './prompts.yaml'),
      'utf-8'
    );
    return parse(promptsYaml) as PromptConfig;
  } catch (error) {
    logger.warn('Could not load prompts from YAML file, using defaults', { error });
    return defaultPrompts;
  }
})();
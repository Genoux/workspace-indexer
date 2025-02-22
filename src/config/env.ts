// src/config/env.ts
import { config } from 'dotenv';
import { AppError } from '@/utils/errors.js';
config();

const required = ['NOTION_API_KEY', 'PINECONE_API_KEY', 'OPENAI_API_KEY'] as const;

export const env = required.reduce((vars, key) => ({
  ...vars,
  [key]: process.env[key] ?? ''
}), {} as Record<typeof required[number], string>);

export function validateEnv() {
  const missingKeys = required.filter(key => !env[key]);
  if (missingKeys.length > 0) {
    throw new AppError(
      `Missing environment variables: ${missingKeys.join(', ')}`,
      'ENV_ERROR'
    );
  }
}

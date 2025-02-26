// src/config/env.ts
import { config } from 'dotenv';
import { Result, err, ok } from 'neverthrow';

config();

const required = ['NOTION_API_KEY', 'PINECONE_API_KEY', 'OPENAI_API_KEY', 'REDIS_URL'] as const;

export const env = required.reduce((vars, key): Record<typeof required[number], string> => ({
  ...vars,
  [key]: process.env[key] ?? ''
}), {} as Record<typeof required[number], string>);

/**
 * Validates that all required environment variables are set
 * Returns ok(true) if valid, or an error result if not
 */
export function validateEnv(): Result<true, Error> {
  const missingKeys = required.filter(key => !env[key]);
  
  if (missingKeys.length > 0) {
    return err(new Error(`Missing environment variables: ${missingKeys.join(', ')}`));
  }
  
  return ok(true);
}
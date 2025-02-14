// src/utils/errors.ts
import { logger } from './logger.js';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public details?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    logger.error({
      code: error.code,
      message: error.message,
      details: error.details,
    });
  } else if (error instanceof Error) {
    logger.error({
      code: 'UNKNOWN_ERROR',
      message: error.message,
      stack: error.stack,
    });
  } else {
    logger.error({
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      error,
    });
  }
}

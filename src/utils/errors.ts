// src/utils/errors.ts
export class ConfigError extends Error {
  constructor(
    public category: string,
    public key: string,
  ) {
    super(`Missing required configuration: ${category}.${key}`);
    this.name = 'ConfigError';
  }
}

export function handleError(error: unknown) {
  const logger = require('./logger').logger;

  if (error instanceof ConfigError) {
    logger.error(
      {
        error: 'Configuration Missing',
        category: error.category,
        key: error.key,
      },
      error.message,
    );
  } else if (error instanceof Error) {
    logger.error({
      error: error.name,
      message: error.message,
      stack: error.stack,
    });
  } else {
    logger.error({
      error: 'Unknown Error',
      value: error,
    });
  }
  process.exit(1);
}

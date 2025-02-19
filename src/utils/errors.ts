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
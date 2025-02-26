import pino from 'pino';

export const logger = pino({
  level: process.env.DEBUG === 'true' ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

export const logObject = (msg: string, obj: object) => {
  logger.debug({ msg, data: obj });
};
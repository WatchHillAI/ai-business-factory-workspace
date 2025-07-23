/**
 * Backend Logging System using Pino
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

export const logger = pino({
  level: logLevel,
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }
  } : undefined,
  base: {
    service: 'ai-business-factory',
    version: '1.0.0',
  },
});

export const createLogger = (component: string) => logger.child({ component });

export default logger;
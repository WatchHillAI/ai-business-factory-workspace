import winston from 'winston';

export interface LoggerConfig {
  level?: 'error' | 'warn' | 'info' | 'debug';
  service?: string;
  format?: 'json' | 'simple';
}

export function createLogger(service: string, config: LoggerConfig = {}): winston.Logger {
  const { level = 'info', format = 'json' } = config;
  
  const logFormat = format === 'json' 
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, service: logService, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            service: logService || service,
            ...meta
          });
        })
      )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, service: logService }) => {
          return `${timestamp} [${level.toUpperCase()}] ${logService || service}: ${message}`;
        })
      );

  return winston.createLogger({
    level,
    format: logFormat,
    transports: [
      new winston.transports.Console(),
      // Add CloudWatch transport for production
      ...(process.env.NODE_ENV === 'production' ? [] : [])
    ],
    defaultMeta: { service }
  });
}
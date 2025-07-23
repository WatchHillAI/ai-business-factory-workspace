/**
 * Modern Structured Logging System
 * 
 * Features:
 * - Environment-aware output (pretty in dev, JSON in prod)
 * - Structured metadata support
 * - Performance tracking
 * - Browser-friendly with fallback support
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, any>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  component?: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment: boolean;
  private minLevel: LogLevel;
  private sessionId: string;

  constructor() {
    this.isDevelopment = typeof window !== 'undefined' 
      ? window.location.hostname === 'localhost'
      : process.env.NODE_ENV === 'development';
    
    this.minLevel = this.isDevelopment ? 'debug' : 'info';
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext, component?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      component,
      sessionId: this.sessionId,
    };
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty console output for development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      }[entry.level];

      const componentTag = entry.component ? `[${entry.component}]` : '';
      const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : '';
      
      console[entry.level === 'debug' ? 'log' : entry.level](
        `${emoji} ${componentTag} ${entry.message}`,
        contextStr ? '\n' + contextStr : ''
      );
    } else {
      // Structured JSON for production
      if (typeof window !== 'undefined') {
        // Browser environment - store for potential collection
        const logStorage = window.localStorage.getItem('app_logs') || '[]';
        const logs = JSON.parse(logStorage);
        logs.push(entry);
        
        // Keep only last 100 logs in browser storage
        if (logs.length > 100) {
          logs.shift();
        }
        
        window.localStorage.setItem('app_logs', JSON.stringify(logs));
      }
      
      // Always output to console for collection by log aggregators
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext, component?: string): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, context, component));
    }
  }

  info(message: string, context?: LogContext, component?: string): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, context, component));
    }
  }

  warn(message: string, context?: LogContext, component?: string): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, context, component));
    }
  }

  error(message: string, context?: LogContext, component?: string): void {
    if (this.shouldLog('error')) {
      this.output(this.formatEntry('error', message, context, component));
    }
  }

  // Performance timing utilities
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    } else {
      this.info(`Timer: ${label} completed`, context);
    }
  }

  // Create component-specific logger
  child(component: string): ComponentLogger {
    return new ComponentLogger(this, component);
  }
}

class ComponentLogger {
  constructor(private parent: Logger, private component: string) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, context, this.component);
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, context, this.component);
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, context, this.component);
  }

  error(message: string, context?: LogContext): void {
    this.parent.error(message, context, this.component);
  }

  time(label: string): void {
    this.parent.time(`${this.component}:${label}`);
  }

  timeEnd(label: string, context?: LogContext): void {
    this.parent.timeEnd(`${this.component}:${label}`, context);
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience function for creating component loggers
export const createLogger = (component: string) => logger.child(component);
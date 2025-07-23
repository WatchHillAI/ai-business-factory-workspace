export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  agentId: string;
  message: string;
  metadata?: any;
  error?: Error;
}

export class Logger {
  private agentId: string;
  private logLevel: LogLevel;
  private entries: LogEntry[] = [];
  private maxEntries: number;

  constructor(agentId: string, logLevel: LogLevel = LogLevel.INFO, maxEntries: number = 1000) {
    this.agentId = agentId;
    this.logLevel = logLevel;
    this.maxEntries = maxEntries;
  }

  private log(level: LogLevel, message: string, metadata?: any, error?: Error): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      agentId: this.agentId,
      message,
      metadata,
      error,
    };

    this.entries.push(entry);

    // Maintain max entries limit
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Console output for development
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const levelName = levelNames[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}] [${entry.agentId}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, entry.metadata);
        if (entry.error) console.warn(entry.error);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`, entry.metadata);
        if (entry.error) console.error(entry.error);
        break;
    }
  }

  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: any, error?: Error): void {
    this.log(LogLevel.WARN, message, metadata, error);
  }

  error(message: string, error?: Error, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  // Get recent log entries
  getEntries(maxEntries?: number): LogEntry[] {
    const entries = maxEntries 
      ? this.entries.slice(-maxEntries)
      : this.entries;
    
    return [...entries]; // Return copy
  }

  // Get entries by level
  getEntriesByLevel(level: LogLevel, maxEntries?: number): LogEntry[] {
    const filtered = this.entries.filter(entry => entry.level === level);
    
    return maxEntries 
      ? filtered.slice(-maxEntries)
      : filtered;
  }

  // Clear log entries
  clear(): void {
    this.entries = [];
  }

  // Get current log level
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  // Set log level
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  // Get statistics about log entries
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    timeRange: { earliest?: string; latest?: string };
  } {
    const stats = {
      total: this.entries.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
      },
      timeRange: {
        earliest: undefined as string | undefined,
        latest: undefined as string | undefined,
      }
    };

    if (this.entries.length === 0) {
      return stats;
    }

    // Count by level
    this.entries.forEach(entry => {
      stats.byLevel[entry.level]++;
    });

    // Time range
    stats.timeRange.earliest = this.entries[0].timestamp;
    stats.timeRange.latest = this.entries[this.entries.length - 1].timestamp;

    return stats;
  }
}
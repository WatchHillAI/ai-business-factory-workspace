// Lambda-Optimized Shared Utilities
// Lightweight versions of common utilities for serverless environment

// =================== LOGGER ===================
const createLogger = (service) => ({
  info: (msg, meta = {}) => console.log(JSON.stringify({ 
    level: 'info', 
    service, 
    message: typeof msg === 'string' ? msg : JSON.stringify(msg), 
    timestamp: new Date().toISOString(),
    ...meta 
  })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ 
    level: 'error', 
    service, 
    message: typeof msg === 'string' ? msg : JSON.stringify(msg), 
    timestamp: new Date().toISOString(),
    ...meta 
  })),
  warn: (msg, meta = {}) => console.warn(JSON.stringify({ 
    level: 'warn', 
    service, 
    message: typeof msg === 'string' ? msg : JSON.stringify(msg), 
    timestamp: new Date().toISOString(),
    ...meta 
  })),
  debug: (msg, meta = {}) => console.debug(JSON.stringify({ 
    level: 'debug', 
    service, 
    message: typeof msg === 'string' ? msg : JSON.stringify(msg), 
    timestamp: new Date().toISOString(),
    ...meta 
  }))
});

// =================== DATABASE CONNECTION ===================
class LambdaDatabase {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.logger = createLogger('lambda-database');
  }

  // Lightweight database operations for Lambda
  async query(sql, params = []) {
    this.logger.info('Database query (simulated)', { sql: sql.substring(0, 100) });
    // In real implementation, use connection pooling for Lambda
    // e.g., using serverless-postgres or similar
    return { rows: [], affectedRows: 0 };
  }

  async findOpportunity(id) {
    this.logger.info('Finding opportunity', { id });
    // Simulated response
    return {
      id,
      title: 'Sample Opportunity',
      description: 'A business opportunity',
      tags: ['ai', 'business'],
      score: 75
    };
  }

  async saveValidationResult(result) {
    this.logger.info('Saving validation result', { id: result.id });
    return { success: true, id: result.id };
  }
}

// =================== UTILITIES ===================
const generateId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}`;
};

// =================== EXPORTS ===================
module.exports = {
  // Core utilities
  createLogger,
  LambdaDatabase,
  generateId
};
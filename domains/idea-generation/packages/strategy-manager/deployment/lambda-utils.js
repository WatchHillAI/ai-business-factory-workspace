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

// =================== REDIS/QUEUE ABSTRACTION ===================
class LambdaQueue {
  constructor(queueName) {
    this.queueName = queueName;
    this.logger = createLogger('lambda-queue');
  }

  // For Lambda, we often replace traditional queues with:
  // - SQS for async processing
  // - SNS for notifications
  // - Step Functions for workflows
  async enqueue(job) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.logger.info('Job enqueued (simulated)', { jobId, type: job.type });
    
    // In real implementation, would publish to SQS
    return jobId;
  }

  async getQueueStats() {
    return {
      pending: 0,
      processing: 0,
      completed: 12,
      failed: 1
    };
  }
}

// =================== HTTP CLIENT ===================
class LambdaHttpClient {
  constructor() {
    this.logger = createLogger('lambda-http');
  }

  async get(url, options = {}) {
    return this.request('GET', url, null, options);
  }

  async post(url, data, options = {}) {
    return this.request('POST', url, data, options);
  }

  async request(method, url, data = null, options = {}) {
    const startTime = Date.now();
    
    try {
      // Using native fetch in Node.js 18+
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Business-Factory-Lambda/1.0',
          ...options.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options
      });

      const responseData = await response.json();
      const duration = Date.now() - startTime;

      this.logger.info('HTTP request completed', {
        method,
        url: url.substring(0, 100),
        status: response.status,
        duration
      });

      return {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers)
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('HTTP request failed', {
        method,
        url: url.substring(0, 100),
        error: error.message,
        duration
      });
      throw error;
    }
  }
}

// =================== CONFIG MANAGEMENT ===================
class LambdaConfig {
  constructor() {
    this.config = {
      environment: process.env.NODE_ENV || 'production',
      logLevel: process.env.LOG_LEVEL || 'info',
      region: process.env.AWS_REGION || 'us-east-1',
      // Database
      databaseUrl: process.env.DATABASE_URL,
      // External APIs
      openaiApiKey: process.env.OPENAI_API_KEY,
      claudeApiKey: process.env.CLAUDE_API_KEY,
      // Service endpoints
      analyzerApiUrl: process.env.ANALYZER_API_URL || 'https://8iu90se87h.execute-api.us-east-1.amazonaws.com/prod',
      scraperApiUrl: process.env.SCRAPER_API_URL || 'https://6pfrpp9myj.execute-api.us-east-1.amazonaws.com/prod',
      validatorApiUrl: process.env.VALIDATOR_API_URL || 'https://cp5uz7gvhe.execute-api.us-east-1.amazonaws.com/prod'
    };
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
  }

  isProduction() {
    return this.config.environment === 'production';
  }

  isDevelopment() {
    return this.config.environment === 'development';
  }
}

// =================== ERROR HANDLING ===================
class LambdaError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = 'LambdaError';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

const createErrorResponse = (error, statusCode = 500) => {
  const logger = createLogger('error-handler');
  
  logger.error('Lambda error occurred', {
    message: error.message,
    statusCode: error.statusCode || statusCode,
    stack: error.stack,
    details: error.details || {}
  });

  return {
    statusCode: error.statusCode || statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: true,
      message: error.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
  };
};

// =================== VALIDATION UTILITIES ===================
const validateInput = (input, schema) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = input[field];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value !== undefined && rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
    }
    
    if (value !== undefined && rules.minLength && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }
    
    if (value !== undefined && rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${field} must be no more than ${rules.maxLength} characters`);
    }
    
    if (value !== undefined && rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// =================== UTILITIES ===================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await sleep(delay * attempt); // Exponential backoff
    }
  }
  
  throw lastError;
};

const generateId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}`;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

// =================== PERFORMANCE MONITORING ===================
class LambdaMetrics {
  constructor() {
    this.metrics = new Map();
    this.logger = createLogger('lambda-metrics');
  }

  startTimer(name) {
    this.metrics.set(name, { startTime: Date.now() });
  }

  endTimer(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      const duration = Date.now() - metric.startTime;
      this.logger.info('Performance metric', { name, duration });
      return duration;
    }
    return 0;
  }

  trackMemoryUsage() {
    const usage = process.memoryUsage();
    this.logger.info('Memory usage', {
      rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB'
    });
    return usage;
  }
}

// =================== EXPORTS ===================
module.exports = {
  // Core utilities
  createLogger,
  LambdaDatabase,
  LambdaQueue,
  LambdaHttpClient,
  LambdaConfig,
  
  // Error handling
  LambdaError,
  createErrorResponse,
  
  // Validation
  validateInput,
  
  // Utilities
  sleep,
  retry,
  generateId,
  sanitizeInput,
  
  // Monitoring
  LambdaMetrics,
  
  // Common response helpers
  successResponse: (data, statusCode = 200) => ({
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })
  }),
  
  errorResponse: (message, statusCode = 400) => ({
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    })
  })
};
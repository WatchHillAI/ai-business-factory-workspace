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

// =================== UTILITIES ===================
const generateId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}`;
};

// =================== EXPORTS ===================
module.exports = {
  createLogger,
  generateId
};
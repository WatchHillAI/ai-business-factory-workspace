const crypto = require('crypto');

class ResponseCache {
  constructor(config = {}) {
    this.config = config;
    this.redis = null;
    this.defaultTTL = 3600; // 1 hour
    this.enabled = config.cacheEnabled !== false;
  }
  
  async get(cacheKey) {
    if (!this.enabled) return null;
    
    try {
      const redis = await this.getRedis();
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const response = JSON.parse(cached);
        response.cached = true;
        return response;
      }
      
      return null;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }
  
  async set(cacheKey, response, customTTL = null) {
    if (!this.enabled) return;
    
    try {
      const redis = await this.getRedis();
      const ttl = customTTL || this.defaultTTL;
      
      await redis.setex(cacheKey, ttl, JSON.stringify({
        ...response,
        cached: false,
        cachedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }
  
  async invalidate(pattern) {
    if (!this.enabled) return;
    
    try {
      const redis = await this.getRedis();
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }
  
  generateCacheKey(request) {
    // Create a deterministic cache key based on request content
    const content = JSON.stringify({
      taskType: request.taskType,
      prompt: request.prompt,
      context: request.context || '',
      maxTokens: request.maxTokens || 4000,
      temperature: request.temperature || 0.7
    });
    
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `ai_cache:${hash.slice(0, 16)}`;
  }
  
  calculateTTL(request) {
    // Different cache durations based on task type
    const ttlMap = {
      'business_plan': 24 * 3600,     // 24 hours - business plans are stable
      'market_analysis': 3600,        // 1 hour - market data changes frequently
      'sentiment_analysis': 30 * 60,  // 30 minutes - sentiment is time-sensitive
      'general': this.defaultTTL      // 1 hour default
    };
    
    const baseTTL = ttlMap[request.taskType] || this.defaultTTL;
    
    // Apply cache multiplier from environment config
    const multiplier = this.config.cacheTtlMultiplier || 1.0;
    return Math.floor(baseTTL * multiplier);
  }
  
  async getRedis() {
    if (!this.redis) {
      const Redis = require('redis');
      const endpoint = this.config.redisEndpoint || 'localhost';
      
      this.redis = Redis.createClient({
        url: `redis://${endpoint}:6379`,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        },
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });
      
      this.redis.on('error', (err) => {
        console.warn('Redis error:', err);
      });
      
      await this.redis.connect();
    }
    
    return this.redis;
  }
  
  async close() {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
    }
  }
  
  // Utility methods for cache management
  async getStats() {
    try {
      const redis = await this.getRedis();
      const info = await redis.info('stats');
      
      // Parse Redis info response
      const stats = {};
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = isNaN(value) ? value : parseFloat(value);
        }
      });
      
      return {
        hitRate: stats.keyspace_hits / (stats.keyspace_hits + stats.keyspace_misses) || 0,
        totalRequests: stats.keyspace_hits + stats.keyspace_misses,
        memoryUsed: stats.used_memory,
        connectedClients: stats.connected_clients
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return null;
    }
  }
  
  async warmup(commonRequests = []) {
    // Pre-populate cache with common requests
    console.log('Warming up cache with common requests...');
    
    for (const request of commonRequests) {
      const cacheKey = this.generateCacheKey(request);
      const existing = await this.get(cacheKey);
      
      if (!existing) {
        console.log(`Cache miss for warmup request: ${request.taskType}`);
        // Note: In a real implementation, you'd generate the response here
        // For now, we just log that it would need to be generated
      }
    }
  }
}

module.exports = { ResponseCache };
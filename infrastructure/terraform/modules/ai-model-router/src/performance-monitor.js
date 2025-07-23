const { v4: uuidv4 } = require('uuid');

class PerformanceMonitor {
  constructor(config = {}) {
    this.config = config;
    this.database = null;
    this.redis = null;
    this.metricsEnabled = config.metricsEnabled !== false;
  }
  
  async record(request, response) {
    if (!this.metricsEnabled) return;
    
    try {
      const metrics = {
        requestId: uuidv4(),
        taskType: request.taskType,
        model: response.model,
        provider: response.provider,
        tokensUsed: response.tokensUsed || 0,
        cost: response.cost || 0,
        latency: response.latency || 0,
        success: !response.error,
        fallbackUsed: response.fallbackUsed || false,
        cached: response.cached || false,
        timestamp: new Date(),
        userId: request.userId || 'anonymous',
        sessionId: request.sessionId || null
      };
      
      // Store in database for long-term analysis
      await this.storeLongTermMetrics(metrics);
      
      // Update real-time metrics in Redis
      await this.updateRealTimeMetrics(metrics);
      
      // Log performance data
      console.log(`AI Request: ${metrics.taskType} | ${metrics.provider}:${metrics.model} | ${metrics.latency}ms | $${metrics.cost} | Cached: ${metrics.cached}`);
      
    } catch (error) {
      console.warn('Failed to record performance metrics:', error);
    }
  }
  
  async recordError(request, error) {
    if (!this.metricsEnabled) return;
    
    try {
      const errorMetrics = {
        requestId: uuidv4(),
        taskType: request.taskType,
        model: 'unknown',
        provider: 'unknown',
        tokensUsed: 0,
        cost: 0,
        latency: 0,
        success: false,
        fallbackUsed: false,
        cached: false,
        timestamp: new Date(),
        userId: request.userId || 'anonymous',
        sessionId: request.sessionId || null,
        errorMessage: error.message,
        errorType: error.constructor.name
      };
      
      await this.storeLongTermMetrics(errorMetrics);
      await this.updateErrorMetrics(errorMetrics);
      
      console.error(`AI Error: ${errorMetrics.taskType} | ${error.message}`);
      
    } catch (recordError) {
      console.warn('Failed to record error metrics:', recordError);
    }
  }
  
  async storeLongTermMetrics(metrics) {
    try {
      const database = await this.getDatabase();
      
      await database.query(`
        INSERT INTO ai_model_metrics (
          request_id, task_type, model, provider, tokens_used, cost, latency, 
          success, fallback_used, cached, timestamp, user_id, session_id, 
          error_message, error_type
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
      `, [
        metrics.requestId,
        metrics.taskType,
        metrics.model,
        metrics.provider,
        metrics.tokensUsed,
        metrics.cost,
        metrics.latency,
        metrics.success,
        metrics.fallbackUsed,
        metrics.cached,
        metrics.timestamp,
        metrics.userId,
        metrics.sessionId,
        metrics.errorMessage || null,
        metrics.errorType || null
      ]);
      
    } catch (error) {
      console.warn('Failed to store long-term metrics:', error);
    }
  }
  
  async updateRealTimeMetrics(metrics) {
    try {
      const redis = await this.getRedis();
      const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
      const day = new Date().toISOString().slice(0, 10);   // YYYY-MM-DD
      
      // Track requests per hour by provider
      await redis.incr(`metrics:${hour}:${metrics.provider}:requests`);
      await redis.incrbyfloat(`metrics:${hour}:${metrics.provider}:cost`, metrics.cost);
      await redis.incr(`metrics:${hour}:${metrics.provider}:tokens`, metrics.tokensUsed);
      
      // Track daily totals
      await redis.incr(`metrics:${day}:total:requests`);
      await redis.incrbyfloat(`metrics:${day}:total:cost`, metrics.cost);
      
      // Track latency distribution
      await redis.lpush(`metrics:${hour}:${metrics.provider}:latency`, metrics.latency);
      await redis.ltrim(`metrics:${hour}:${metrics.provider}:latency`, 0, 999);
      
      // Track task type distribution
      await redis.incr(`metrics:${hour}:task:${metrics.taskType}:requests`);
      
      // Track cache hit rate
      if (metrics.cached) {
        await redis.incr(`metrics:${hour}:cache:hits`);
      } else {
        await redis.incr(`metrics:${hour}:cache:misses`);
      }
      
      // Track fallback usage
      if (metrics.fallbackUsed) {
        await redis.incr(`metrics:${hour}:fallback:used`);
      }
      
      // Set expiration for metrics (keep for 7 days)
      await redis.expire(`metrics:${hour}:${metrics.provider}:requests`, 7 * 24 * 3600);
      await redis.expire(`metrics:${hour}:${metrics.provider}:cost`, 7 * 24 * 3600);
      await redis.expire(`metrics:${hour}:${metrics.provider}:tokens`, 7 * 24 * 3600);
      await redis.expire(`metrics:${hour}:${metrics.provider}:latency`, 7 * 24 * 3600);
      
    } catch (error) {
      console.warn('Failed to update real-time metrics:', error);
    }
  }
  
  async updateErrorMetrics(errorMetrics) {
    try {
      const redis = await this.getRedis();
      const hour = new Date().toISOString().slice(0, 13);
      
      await redis.incr(`metrics:${hour}:errors:total`);
      await redis.incr(`metrics:${hour}:errors:${errorMetrics.taskType}`);
      await redis.incr(`metrics:${hour}:errors:type:${errorMetrics.errorType}`);
      
      // Set expiration
      await redis.expire(`metrics:${hour}:errors:total`, 7 * 24 * 3600);
      await redis.expire(`metrics:${hour}:errors:${errorMetrics.taskType}`, 7 * 24 * 3600);
      await redis.expire(`metrics:${hour}:errors:type:${errorMetrics.errorType}`, 7 * 24 * 3600);
      
    } catch (error) {
      console.warn('Failed to update error metrics:', error);
    }
  }
  
  async getProviderStats(timeframe = 'hour') {
    try {
      const redis = await this.getRedis();
      const now = new Date();
      let timeKey;
      
      switch (timeframe) {
        case 'hour':
          timeKey = now.toISOString().slice(0, 13);
          break;
        case 'day':
          timeKey = now.toISOString().slice(0, 10);
          break;
        default:
          timeKey = now.toISOString().slice(0, 13);
      }
      
      const providers = ['openai', 'claude', 'gemini'];
      const stats = {};
      
      for (const provider of providers) {
        const requests = await redis.get(`metrics:${timeKey}:${provider}:requests`) || 0;
        const cost = await redis.get(`metrics:${timeKey}:${provider}:cost`) || 0;
        const tokens = await redis.get(`metrics:${timeKey}:${provider}:tokens`) || 0;
        
        // Get latency distribution
        const latencies = await redis.lrange(`metrics:${timeKey}:${provider}:latency`, 0, -1);
        const avgLatency = latencies.length > 0 
          ? latencies.reduce((sum, val) => sum + parseFloat(val), 0) / latencies.length 
          : 0;
        
        stats[provider] = {
          requests: parseInt(requests),
          cost: parseFloat(cost),
          tokens: parseInt(tokens),
          avgLatency: Math.round(avgLatency),
          costPerRequest: requests > 0 ? parseFloat(cost) / parseInt(requests) : 0,
          tokensPerRequest: requests > 0 ? parseInt(tokens) / parseInt(requests) : 0
        };
      }
      
      return stats;
      
    } catch (error) {
      console.warn('Failed to get provider stats:', error);
      return {};
    }
  }
  
  async getCacheStats() {
    try {
      const redis = await this.getRedis();
      const hour = new Date().toISOString().slice(0, 13);
      
      const hits = await redis.get(`metrics:${hour}:cache:hits`) || 0;
      const misses = await redis.get(`metrics:${hour}:cache:misses`) || 0;
      const total = parseInt(hits) + parseInt(misses);
      
      return {
        hits: parseInt(hits),
        misses: parseInt(misses),
        total,
        hitRate: total > 0 ? parseInt(hits) / total : 0
      };
      
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { hits: 0, misses: 0, total: 0, hitRate: 0 };
    }
  }
  
  async getDatabase() {
    if (!this.database) {
      // This would typically use aws-sdk for RDS Data API
      // For now, we'll use a simple pg-like interface
      this.database = {
        query: async (sql, params) => {
          // In real implementation, this would use RDS Data API
          console.log('Database query:', sql, params);
          return { rows: [] };
        }
      };
    }
    return this.database;
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
        }
      });
      
      this.redis.on('error', (err) => {
        console.warn('Redis error:', err);
      });
      
      await this.redis.connect();
    }
    
    return this.redis;
  }
  
  async generateReport(timeframe = 'hour') {
    try {
      const providerStats = await this.getProviderStats(timeframe);
      const cacheStats = await this.getCacheStats();
      
      const report = {
        timeframe,
        timestamp: new Date().toISOString(),
        providers: providerStats,
        caching: cacheStats,
        summary: {
          totalRequests: Object.values(providerStats).reduce((sum, provider) => sum + provider.requests, 0),
          totalCost: Object.values(providerStats).reduce((sum, provider) => sum + provider.cost, 0),
          totalTokens: Object.values(providerStats).reduce((sum, provider) => sum + provider.tokens, 0),
          avgLatency: Object.values(providerStats).reduce((sum, provider) => sum + provider.avgLatency, 0) / Object.keys(providerStats).length
        }
      };
      
      return report;
      
    } catch (error) {
      console.warn('Failed to generate performance report:', error);
      return null;
    }
  }
}

module.exports = { PerformanceMonitor };
// Strategy Manager Lambda Handler - SQS Integrated
const { createLogger, generateId, LambdaDatabase } = require('./lambda-shared-utils');

const logger = createLogger('strategy-manager');

class StrategyManager {
  constructor(strategiesConfig = null, databaseUrl = null) {
    this.strategies = new Map();
    this.experiments = new Map();
    this.performanceData = new Map();
    this.database = databaseUrl ? new LambdaDatabase(databaseUrl) : null;
    
    if (strategiesConfig) {
      this.loadStrategiesFromConfig(strategiesConfig);
    } else {
      this.loadDefaultStrategies();
    }
  }

  loadStrategiesFromConfig(strategiesConfig) {
    try {
      const strategies = typeof strategiesConfig === 'string' ? 
        JSON.parse(strategiesConfig) : strategiesConfig;
      
      const strategyArray = Array.isArray(strategies) ? strategies : [strategies];
      
      strategyArray.forEach(strategy => {
        if (!strategy.id || !strategy.name) {
          logger.warn('Invalid strategy config', { strategy });
          return;
        }
        
        const fullStrategy = {
          enabled: true,
          sources: [],
          keywords: [],
          scoring: { weight: 1.0, bonusKeywords: [] },
          schedule: '0 */6 * * *',
          metadata: { priority: 'medium', category: 'general' },
          ...strategy
        };
        
        this.strategies.set(strategy.id, fullStrategy);
      });
      
      logger.info('Strategies loaded from config', { 
        count: this.strategies.size,
        strategyIds: Array.from(this.strategies.keys())
      });
    } catch (error) {
      logger.error('Failed to parse strategies config', { error: error.message });
      this.loadDefaultStrategies();
    }
  }

  loadDefaultStrategies() {
    const defaultStrategies = [
      {
        id: 'default-web-search',
        name: 'Default Web Search',
        description: 'Basic web search strategy',
        enabled: true,
        sources: ['https://example.com'],
        keywords: ['business', 'opportunity'],
        scoring: { weight: 1.0, bonusKeywords: [] },
        metadata: { priority: 'low', category: 'fallback' }
      }
    ];
    
    this.loadStrategiesFromConfig(defaultStrategies);
    logger.info('Loaded default fallback strategies');
  }

  getStrategies() {
    return Array.from(this.strategies.values());
  }

  getEnabledStrategies() {
    return Array.from(this.strategies.values()).filter(s => s.enabled);
  }

  getStrategy(id) {
    return this.strategies.get(id);
  }

  async updateStrategy(id, updates) {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      throw new Error(`Strategy ${id} not found`);
    }

    if (updates.keywords && !Array.isArray(updates.keywords)) {
      throw new Error('Keywords must be an array');
    }

    if (updates.sources && !Array.isArray(updates.sources)) {
      throw new Error('Sources must be an array');
    }

    const updatedStrategy = { ...strategy, ...updates };
    this.strategies.set(id, updatedStrategy);
    
    if (this.database) {
      try {
        await this.database.query(
          'UPDATE strategies SET config = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(updatedStrategy), id]
        );
      } catch (error) {
        logger.warn('Failed to save strategy update to database', { id, error: error.message });
      }
    }
    
    logger.info('Strategy updated', { id, updates: Object.keys(updates) });
    return updatedStrategy;
  }

  async toggleStrategy(id, enabled) {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      throw new Error(`Strategy ${id} not found`);
    }

    strategy.enabled = enabled;
    
    if (this.database) {
      try {
        await this.database.query(
          'UPDATE strategies SET enabled = $1, updated_at = NOW() WHERE id = $2',
          [enabled, id]
        );
      } catch (error) {
        logger.warn('Failed to save strategy toggle to database', { id, error: error.message });
      }
    }
    
    logger.info('Strategy toggled', { id, enabled });
    return strategy;
  }

  getStrategyForRequest() {
    // A/B testing allocation would go here
    const enabledStrategies = this.getEnabledStrategies();
    if (enabledStrategies.length === 0) {
      const allStrategies = this.getStrategies();
      return allStrategies.length > 0 ? allStrategies[0].id : 'default';
    }
    
    return enabledStrategies[Math.floor(Math.random() * enabledStrategies.length)].id;
  }

  async recordPerformance(strategyId, metrics) {
    if (!this.strategies.has(strategyId)) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    if (this.database) {
      try {
        await this.database.query(`
          INSERT INTO strategy_performance 
          (strategy_id, opportunities_found, relevance_score, sentiment_score, processing_time, recorded_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          strategyId,
          metrics.opportunitiesFound || 0,
          metrics.relevanceScore || 0,
          metrics.sentimentScore || 0,
          metrics.processingTime || 0
        ]);
        
        logger.info('Performance recorded to database', { strategyId });
        return;
      } catch (error) {
        logger.warn('Failed to save performance to database', { error: error.message });
      }
    }

    // Fallback to in-memory
    const performance = this.performanceData.get(strategyId) || {
      opportunitiesFound: 0,
      avgRelevanceScore: 0,
      avgSentimentScore: 0,
      totalProcessingTime: 0,
      lastUpdate: new Date().toISOString(),
      overallScore: 0
    };

    performance.opportunitiesFound += (metrics.opportunitiesFound || 0);
    performance.avgRelevanceScore = (performance.avgRelevanceScore + (metrics.relevanceScore || 0)) / 2;
    performance.avgSentimentScore = (performance.avgSentimentScore + (metrics.sentimentScore || 0)) / 2;
    performance.totalProcessingTime += (metrics.processingTime || 0);
    performance.lastUpdate = new Date().toISOString();
    performance.overallScore = Math.round(
      (performance.avgRelevanceScore * 0.6 + 
       (performance.avgSentimentScore + 1) * 0.2 + 
       Math.min(performance.opportunitiesFound / 10, 1) * 0.2) * 100
    );

    this.performanceData.set(strategyId, performance);
    logger.info('Performance recorded in memory', { strategyId, overallScore: performance.overallScore });
  }

  async getDashboardData() {
    const strategies = this.getStrategies();
    const enabledCount = this.getEnabledStrategies().length;
    
    return {
      summary: {
        totalStrategies: strategies.length,
        enabledStrategies: enabledCount,
        runningExperiments: 0,
        totalOpportunities: 0,
        avgPerformanceScore: 0
      },
      strategies: strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        enabled: strategy.enabled,
        category: strategy.metadata?.category,
        priority: strategy.metadata?.priority,
        performance: this.performanceData.get(strategy.id) || {
          opportunitiesFound: 0,
          avgRelevanceScore: 0,
          overallScore: 0
        }
      })),
      experiments: [],
      recentActivity: [
        {
          id: generateId('activity'),
          message: `${enabledCount} strategies currently enabled`,
          timestamp: new Date().toISOString(),
          type: 'system'
        }
      ]
    };
  }
}

// API Gateway handler
exports.apiHandler = async (event, context) => {
  logger.info('API request received', { 
    path: event.path, 
    method: event.httpMethod 
  });

  try {
    const path = event.path;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};

    // Extract configuration
    const strategiesConfig = body.strategies || queryParams.strategies || process.env.STRATEGIES_CONFIG;
    const databaseUrl = process.env.DATABASE_URL;
    
    const strategyManager = new StrategyManager(strategiesConfig, databaseUrl);

    // Health check
    if (path === '/health' && method === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'healthy',
          service: 'strategy-manager',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          features: ['dynamic-strategy-loading', 'sqs-integration', 'performance-tracking'],
          strategiesLoaded: strategyManager.getStrategies().length,
          databaseConnected: !!databaseUrl,
          account: context.invokedFunctionArn.split(':')[4]
        }),
      };
    }

    // Get all strategies
    if (path === '/strategies' && method === 'GET') {
      const strategies = strategyManager.getStrategies();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, data: { strategies }, timestamp: new Date().toISOString() }),
      };
    }

    // Get enabled strategies
    if (path === '/strategies/enabled' && method === 'GET') {
      const strategies = strategyManager.getEnabledStrategies();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, data: { strategies }, timestamp: new Date().toISOString() }),
      };
    }

    // Strategy allocation
    if (path === '/strategies/allocate' && method === 'GET') {
      const strategyId = strategyManager.getStrategyForRequest();
      const strategy = strategyManager.getStrategy(strategyId);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          data: {
            strategyId,
            strategy: strategy ? {
              id: strategy.id,
              name: strategy.name,
              sources: strategy.sources,
              keywords: strategy.keywords,
              scoring: strategy.scoring
            } : null
          },
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Get dashboard data
    if (path === '/dashboard' && method === 'GET') {
      const dashboard = await strategyManager.getDashboardData();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, data: dashboard, timestamp: new Date().toISOString() }),
      };
    }

    // Record performance (called by other services)
    if (path.includes('/performance') && method === 'POST') {
      const pathParts = path.split('/');
      const strategyId = pathParts[pathParts.indexOf('strategies') + 1];
      
      await strategyManager.recordPerformance(strategyId, body);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    logger.error('API handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

// Default handler
exports.handler = exports.apiHandler;
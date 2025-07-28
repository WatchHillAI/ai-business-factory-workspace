// SQS-Based Scheduler Lambda
// Triggered by EventBridge cron rules to queue strategy execution jobs

const { SQSClient, SendMessageCommand, GetQueueUrlCommand } = require('@aws-sdk/client-sqs');
const { createLogger, generateId } = require('./lambda-shared-utils');

const logger = createLogger('scheduler');
const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Default strategy configurations
const DEFAULT_STRATEGIES = [
  {
    id: 'hacker-news',
    name: 'Hacker News Discovery',
    description: 'Scrape trending posts from Hacker News for tech opportunities',
    enabled: true,
    sources: ['https://news.ycombinator.com'],
    keywords: ['startup', 'business', 'tech', 'funding', 'launch'],
    scoring: { weight: 1.0, bonusKeywords: ['YC', 'funded', 'million'] },
    schedule: '0 */6 * * *', // Every 6 hours
    metadata: { priority: 'high', category: 'tech' }
  },
  {
    id: 'product-hunt',
    name: 'Product Hunt Tracker',
    description: 'Monitor new product launches and trends',
    enabled: true,
    sources: ['https://www.producthunt.com'],
    keywords: ['product', 'launch', 'innovation', 'design'],
    scoring: { weight: 0.9, bonusKeywords: ['maker', 'featured', 'top'] },
    schedule: '0 9 * * *', // Daily at 9 AM
    metadata: { priority: 'medium', category: 'products' }
  },
  {
    id: 'indie-hackers',
    name: 'Indie Hackers Community',
    description: 'Track indie business discussions and revenue reports',
    enabled: true,
    sources: ['https://www.indiehackers.com'],
    keywords: ['revenue', 'bootstrap', 'indie', 'saas', 'mrr'],
    scoring: { weight: 1.1, bonusKeywords: ['$', 'revenue', 'mrr', 'arr'] },
    schedule: '0 12 * * *', // Daily at noon
    metadata: { priority: 'high', category: 'business' }
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch News',
    description: 'Track funding news and startup announcements',
    enabled: true,
    sources: ['https://techcrunch.com'],
    keywords: ['funding', 'series', 'startup', 'acquisition'],
    scoring: { weight: 0.7, bonusKeywords: ['million', 'billion', 'unicorn'] },
    schedule: '0 */4 * * *', // Every 4 hours
    metadata: { priority: 'medium', category: 'news' }
  }
];

class SchedulerService {
  constructor() {
    this.queueUrls = {
      scraping: process.env.SCRAPING_QUEUE_URL || 'ai-business-factory-scraping-queue',
      analysis: process.env.ANALYSIS_QUEUE_URL || 'ai-business-factory-analysis-queue',
      validation: process.env.VALIDATION_QUEUE_URL || 'ai-business-factory-validation-queue'
    };
  }

  async getQueueUrl(queueName) {
    try {
      if (this.queueUrls[queueName].startsWith('https://')) {
        return this.queueUrls[queueName];
      }
      
      const command = new GetQueueUrlCommand({ QueueName: this.queueUrls[queueName] });
      const response = await sqs.send(command);
      return response.QueueUrl;
    } catch (error) {
      logger.error('Failed to get queue URL', { queueName, error: error.message });
      throw error;
    }
  }

  async queueScrapingJob(strategy) {
    const jobId = generateId('scrape');
    const job = {
      id: jobId,
      type: 'scrape',
      strategy,
      urls: strategy.sources,
      tags: strategy.keywords,
      priority: strategy.metadata?.priority === 'high' ? 1 : 2,
      createdAt: new Date().toISOString(),
      maxAttempts: 3
    };

    const queueUrl = await this.getQueueUrl('scraping');
    
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(job),
      MessageAttributes: {
        JobType: {
          StringValue: 'scrape',
          DataType: 'String'
        },
        StrategyId: {
          StringValue: strategy.id,
          DataType: 'String'
        },
        Priority: {
          StringValue: job.priority.toString(),
          DataType: 'Number'
        }
      }
    });

    await sqs.send(command);
    logger.info('Scraping job queued', { jobId, strategyId: strategy.id, urls: strategy.sources.length });
    
    return jobId;
  }

  async scheduleStrategies(strategies = null) {
    const strategiesToSchedule = strategies || DEFAULT_STRATEGIES;
    const enabledStrategies = strategiesToSchedule.filter(s => s.enabled);
    
    logger.info('Scheduling strategies', { 
      total: strategiesToSchedule.length, 
      enabled: enabledStrategies.length 
    });

    const results = {
      scheduled: 0,
      failed: 0,
      jobIds: []
    };

    for (const strategy of enabledStrategies) {
      try {
        const jobId = await this.queueScrapingJob(strategy);
        results.jobIds.push(jobId);
        results.scheduled++;
      } catch (error) {
        logger.error('Failed to schedule strategy', { 
          strategyId: strategy.id, 
          error: error.message 
        });
        results.failed++;
      }
    }

    logger.info('Strategy scheduling completed', results);
    return results;
  }
}

const schedulerService = new SchedulerService();

// Lambda handler for scheduled events
exports.scheduledHandler = async (event, context) => {
  logger.info('Scheduled event received', { 
    source: event.source,
    detailType: event['detail-type']
  });

  try {
    const strategies = event.detail?.strategies || DEFAULT_STRATEGIES;
    const results = await schedulerService.scheduleStrategies(strategies);

    logger.info('Scheduled processing completed', results);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    logger.error('Scheduled processing failed', { error: error.message });
    throw error;
  }
};

// API handler for manual triggers
exports.apiHandler = async (event, context) => {
  logger.info('API request received', { 
    path: event.path, 
    method: event.httpMethod 
  });

  try {
    const path = event.path;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

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
          service: 'scheduler',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          features: ['sqs-scheduling', 'strategy-execution'],
          defaultStrategies: DEFAULT_STRATEGIES.length,
          account: context.invokedFunctionArn.split(':')[4]
        }),
      };
    }

    // Manual trigger endpoint
    if (path === '/schedule' && method === 'POST') {
      const { strategies } = body;
      const results = await schedulerService.scheduleStrategies(strategies);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: results,
          timestamp: new Date().toISOString(),
        }),
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
exports.handler = async (event, context) => {
  if (event.source === 'aws.events') {
    return exports.scheduledHandler(event, context);
  } else if (event.httpMethod) {
    return exports.apiHandler(event, context);
  } else {
    logger.error('Unknown event type', { event });
    throw new Error('Unknown event type');
  }
};

// Export additional classes for testing
module.exports.SchedulerService = SchedulerService;
module.exports.DEFAULT_STRATEGIES = DEFAULT_STRATEGIES;
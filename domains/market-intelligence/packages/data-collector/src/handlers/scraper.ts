import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda';
import { ScrapingService } from '../services/scraping';
import { createLogger } from '../utils/logger';
import { DatabaseClient } from '../utils/database';
import { RedisClient } from '../utils/redis';

const logger = createLogger('scraper-handler');

// Initialize services
const dbClient = new DatabaseClient();
const redisClient = new RedisClient();
const scrapingService = new ScrapingService(dbClient, redisClient);

/**
 * Lambda handler for API Gateway events (manual scraping)
 */
export const apiHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Received API request', { path: event.path, method: event.httpMethod });

    // Health check
    if (event.path === '/health' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'healthy',
          service: 'data-collector',
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Manual scraping request
    if (event.path === '/scrape' && event.httpMethod === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const { url, tags, strategyId } = JSON.parse(event.body);

      if (!url || !tags) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'url and tags are required' }),
        };
      }

      const result = await scrapingService.scrapeUrl({
        url,
        tags,
        strategyId,
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Route not found
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
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Lambda handler for SQS events (queue-based scraping)
 */
export const sqsHandler = async (event: SQSEvent): Promise<void> => {
  try {
    logger.info('Received SQS batch', { recordCount: event.Records.length });

    const promises = event.Records.map(async (record) => {
      try {
        const { url, tags, strategyId } = JSON.parse(record.body);
        
        logger.info('Processing scraping job', { url, tags, strategyId });
        
        await scrapingService.scrapeUrl({
          url,
          tags,
          strategyId,
        });
        
        logger.info('Successfully processed scraping job', { url });
      } catch (error) {
        logger.error('Failed to process SQS record', { 
          messageId: record.messageId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error; // Re-throw to trigger SQS retry
      }
    });

    await Promise.all(promises);
    logger.info('Successfully processed all SQS records');

  } catch (error) {
    logger.error('SQS handler error:', error);
    throw error; // Re-throw to trigger Lambda retry
  }
};

/**
 * Lambda handler for scheduled events (periodic scraping)
 */
export const scheduledHandler = async (): Promise<void> => {
  try {
    logger.info('Starting scheduled scraping job');

    // Get enabled strategies and queue scraping jobs
    await scrapingService.scheduleScrapingJobs();

    logger.info('Scheduled scraping job completed');
  } catch (error) {
    logger.error('Scheduled handler error:', error);
    throw error; // Re-throw to trigger CloudWatch alert
  }
};
import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda';
import { AnalysisService } from '../services/analysis';
import { createLogger } from '../utils/logger';

const logger = createLogger('analyzer-handler');

// Initialize analysis service
const analysisService = new AnalysisService();

/**
 * Lambda handler for API Gateway events (manual analysis)
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
          service: 'opportunity-analyzer',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          features: ['ai-analysis', 'scoring', 'market-sizing', 'competition-analysis']
        }),
      };
    }

    // Manual analysis request
    if (event.path === '/analyze' && event.httpMethod === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const { marketData, analysisType } = JSON.parse(event.body);

      if (!marketData) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'marketData is required' }),
        };
      }

      const result = await analysisService.analyzeOpportunity({
        marketData,
        analysisType: analysisType || 'comprehensive'
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

    // Bulk analysis endpoint
    if (event.path === '/analyze/batch' && event.httpMethod === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const { opportunities, options } = JSON.parse(event.body);

      if (!opportunities || !Array.isArray(opportunities)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'opportunities array is required' }),
        };
      }

      const results = await analysisService.analyzeBatch(opportunities, options);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: results,
          count: results.length,
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
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Lambda handler for SQS events (queue-based analysis)
 */
export const sqsHandler = async (event: SQSEvent): Promise<void> => {
  try {
    logger.info('Received SQS batch', { recordCount: event.Records.length });

    const promises = event.Records.map(async (record) => {
      try {
        const { marketData, analysisType, jobId } = JSON.parse(record.body);
        
        logger.info('Processing analysis job', { jobId, analysisType });
        
        await analysisService.analyzeOpportunity({
          marketData,
          analysisType: analysisType || 'comprehensive',
          jobId
        });
        
        logger.info('Successfully processed analysis job', { jobId });
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
 * Lambda handler for scheduled events (batch processing)
 */
export const scheduledHandler = async (): Promise<void> => {
  try {
    logger.info('Starting scheduled analysis job');

    // Process pending opportunities for analysis
    await analysisService.processPendingOpportunities();

    logger.info('Scheduled analysis job completed');
  } catch (error) {
    logger.error('Scheduled handler error:', error);
    throw error; // Re-throw to trigger CloudWatch alert
  }
};
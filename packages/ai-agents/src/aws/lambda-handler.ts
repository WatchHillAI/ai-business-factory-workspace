import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AgentOrchestrator } from '../orchestration/AgentOrchestrator';
import { MarketResearchAgent } from '../agents/MarketResearchAgent';
import { LLMProvider } from '../providers/LLMProvider';
import { CacheProvider } from '../providers/CacheProvider';
import { DataSourceProvider } from '../providers/DataSourceProvider';
import { Logger } from '../utils/Logger';
import { MetricsCollector } from '../utils/MetricsCollector';

/**
 * AWS Lambda Handler for AI Agent System
 * Integrates with existing AI Business Factory infrastructure
 */

const logger = Logger.getInstance();

// Initialize providers using existing AWS infrastructure
const initializeProviders = () => {
  // Use existing AI Model Router layer for LLM management
  const llmProvider = new LLMProvider({
    primaryProvider: 'claude',
    fallbackProvider: 'openai',
    useExistingRouter: true, // Leverage existing AI Model Router
    costOptimization: true
  });

  // Use existing ElastiCache Redis for caching
  const cacheProvider = new CacheProvider({
    type: 'redis',
    redisUrl: process.env.REDIS_URL || '',
    defaultTTL: 3600
  });

  // Configure data sources with external APIs
  const dataSourceProvider = new DataSourceProvider({
    googleTrends: {
      enabled: true,
      apiKey: process.env.GOOGLE_TRENDS_API_KEY
    },
    crunchbase: {
      enabled: true,
      apiKey: process.env.CRUNCHBASE_API_KEY
    },
    semrush: {
      enabled: true,
      apiKey: process.env.SEMRUSH_API_KEY
    }
  });

  return { llmProvider, cacheProvider, dataSourceProvider };
};

// Initialize AI Agent System
const initializeAgentSystem = () => {
  const { llmProvider, cacheProvider, dataSourceProvider } = initializeProviders();

  const orchestrator = new AgentOrchestrator({
    cacheProvider,
    metricsCollector: new MetricsCollector()
  });

  // Register agents
  const marketResearchAgent = new MarketResearchAgent(
    llmProvider,
    cacheProvider,
    dataSourceProvider
  );

  orchestrator.registerAgent('market-research', marketResearchAgent);

  return orchestrator;
};

const orchestrator = initializeAgentSystem();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  logger.info('Processing AI agent request', { requestId, event });

  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // Parse request
    const body = event.body ? JSON.parse(event.body) : {};
    const { path } = event;

    // Route requests based on path
    if (path === '/analyze' && event.httpMethod === 'POST') {
      return await handleIdeaAnalysis(body, corsHeaders);
    }

    if (path === '/health' && event.httpMethod === 'GET') {
      return await handleHealthCheck(corsHeaders);
    }

    // Unknown endpoint
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Not Found',
        message: `Path ${path} not found`,
        requestId
      })
    };

  } catch (error) {
    logger.error('Lambda execution failed', { 
      error: error instanceof Error ? error.message : error,
      requestId 
    });

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'AI agent analysis failed',
        requestId
      })
    };
  }
};

/**
 * Handle business idea analysis requests
 */
async function handleIdeaAnalysis(
  body: any,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const { ideaText, userContext } = body;

  if (!ideaText) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'ideaText is required'
      })
    };
  }

  try {
    // Execute AI agent analysis
    const result = await orchestrator.executeWorkflow([
      {
        agentId: 'market-research',
        input: {
          ideaText,
          userContext: userContext || {}
        }
      }
    ]);

    // Extract market research results
    const marketResearch = result.results['market-research'];

    if (!marketResearch.success) {
      throw new Error('Market research analysis failed');
    }

    // Transform to DetailedIdea format for Ideas PWA
    const detailedIdea = {
      id: `ai-${Date.now()}`,
      type: 'ai-generated' as const,
      title: extractIdeaTitle(ideaText),
      shortDescription: ideaText.substring(0, 200) + '...',
      category: 'AI & Technology', // Could be classified by agents
      difficulty: 'Medium',
      timeToMarket: '6-12 months',
      marketSize: marketResearch.data.marketSignals?.totalMarketSize || 'Unknown',
      
      // AI-generated comprehensive analysis
      overview: {
        executiveSummary: marketResearch.data.problemStatement?.summary || '',
        keyInsights: marketResearch.data.problemStatement?.keyInsights || [],
        confidenceScore: marketResearch.confidence || 0.85
      },

      marketAnalysis: {
        problemStatement: marketResearch.data.problemStatement || {},
        marketSignals: marketResearch.data.marketSignals || {},
        customerEvidence: marketResearch.data.customerEvidence || {},
        competitorAnalysis: marketResearch.data.competitorAnalysis || {},
        marketTiming: marketResearch.data.marketTiming || {}
      },

      // Placeholder for other agents (to be implemented)
      financialModel: {
        revenue: { tamSamSom: null, projections: [], businessModel: null },
        costs: { development: [], operational: [], marketing: [] },
        funding: { requirements: null, stages: [], investors: [] },
        metrics: { unitEconomics: null, keyMetrics: [] }
      },

      teamAndCosts: {
        founderFit: null,
        teamComposition: { coreTeam: [], advisors: [], skillsGap: [] },
        costs: { salaries: [], equity: [], timeline: [] },
        investment: { totalRequired: null, stages: [], useOfFunds: [] }
      },

      strategy: {
        goToMarket: marketResearch.data.marketTiming?.goToMarketStrategy || null,
        competitive: marketResearch.data.competitorAnalysis?.differentiationOpportunities || [],
        partnerships: [],
        scalability: null
      },

      riskAssessment: {
        risks: [],
        mitigations: [],
        contingencyPlans: [],
        successFactors: []
      }
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: detailedIdea,
        metadata: {
          processingTime: result.executionTime,
          totalTokens: result.totalTokensUsed,
          confidence: marketResearch.confidence,
          agentsExecuted: Object.keys(result.results)
        }
      })
    };

  } catch (error) {
    logger.error('Idea analysis failed', { error });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Analysis Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}

/**
 * Handle health check requests
 */
async function handleHealthCheck(
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const health = await orchestrator.getHealthStatus();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        agents: health.agents,
        performance: health.performance,
        version: '1.0.0'
      })
    };

  } catch (error) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Extract a meaningful title from idea text
 */
function extractIdeaTitle(ideaText: string): string {
  // Simple title extraction - could be enhanced with NLP
  const sentences = ideaText.split('.').filter(s => s.trim().length > 0);
  const firstSentence = sentences[0]?.trim() || ideaText.substring(0, 100);
  
  // Clean and truncate
  return firstSentence.length > 50 
    ? firstSentence.substring(0, 47) + '...'
    : firstSentence;
}

/**
 * AppSync GraphQL resolver handler
 * For direct GraphQL API integration
 */
export const graphqlResolver = async (event: any, context: Context) => {
  logger.info('Processing GraphQL resolver request', { 
    requestId: context.awsRequestId,
    fieldName: event.info?.fieldName
  });

  try {
    const { arguments: args } = event;
    
    if (event.info?.fieldName === 'analyzeIdea') {
      const result = await orchestrator.executeWorkflow([
        {
          agentId: 'market-research',
          input: {
            ideaText: args.input.ideaText,
            userContext: args.input.userContext || {}
          }
        }
      ]);

      return {
        success: true,
        analysisId: `ai-${Date.now()}`,
        marketResearch: result.results['market-research']?.data || null,
        confidence: result.results['market-research']?.confidence || 0,
        executionTime: result.executionTime
      };
    }

    throw new Error(`Unknown GraphQL field: ${event.info?.fieldName}`);

  } catch (error) {
    logger.error('GraphQL resolver failed', { 
      error: error instanceof Error ? error.message : error,
      requestId: context.awsRequestId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
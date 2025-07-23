import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AgentOrchestrator, BusinessIdeaAnalysisInput, createAgentOrchestrator } from '../orchestration/AgentOrchestrator';
import { Logger, LogLevel } from '../utils/Logger';
import { MetricsCollector } from '../utils/MetricsCollector';

/**
 * AWS Lambda Handler for AI Agent System
 * Integrates with existing AI Business Factory infrastructure
 */

const logger = new Logger('lambda-handler');

// Initialize orchestrator with production or development configuration
const initializeOrchestrator = (): AgentOrchestrator => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    logger.info('Initializing development orchestrator with mock providers');
    // Use mock providers for development/testing
    return createAgentOrchestrator({
      llmProvider: {
        type: 'mock'
      },
      cacheProvider: {
        type: 'memory'
      },
      dataSourceProviders: [
        {
          name: 'market_data',
          type: 'mock',
          config: {}
        }
      ],
      logLevel: LogLevel.DEBUG,
      enableMetrics: true
    });
  } else {
    logger.info('Initializing production orchestrator with real providers');
    // Production configuration with real APIs
    return createAgentOrchestrator({
      llmProvider: {
        type: process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'claude',
        apiKey: process.env.LLM_API_KEY
      },
      cacheProvider: {
        type: 'redis',
        config: {
          redisUrl: process.env.REDIS_URL,
          defaultTTL: 3600
        }
      },
      dataSourceProviders: [
        {
          name: 'market_data',
          type: 'google_trends', // Will use FreeDataSourceProvider
          config: {
            enabled: true
          }
        }
      ],
      logLevel: LogLevel.INFO,
      enableMetrics: true
    });
  }
};

// Initialize orchestrator instance
const orchestrator = initializeOrchestrator();

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
      return await handleComprehensiveAnalysis(body, corsHeaders);
    }

    if (path === '/analyze/market' && event.httpMethod === 'POST') {
      return await handleMarketAnalysis(body, corsHeaders);
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
 * Handle comprehensive business idea analysis using all agents
 */
async function handleComprehensiveAnalysis(
  body: any,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const { idea, userContext, analysisDepth = 'comprehensive', enabledAgents } = body;

  if (!idea?.title || !idea?.description) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'idea.title and idea.description are required'
      })
    };
  }

  try {
    // Create comprehensive analysis input
    const analysisInput: BusinessIdeaAnalysisInput = {
      idea: {
        title: idea.title,
        description: idea.description,
        category: idea.category || 'ai-automation',
        tier: idea.tier || 'ai-generated'
      },
      userContext: userContext || {},
      analysisDepth: analysisDepth,
      enabledAgents: enabledAgents || {
        marketResearch: true,
        financialModeling: true,
        founderFit: true,
        riskAssessment: true
      }
    };

    // Execute comprehensive analysis
    const result = await orchestrator.analyzeBusiness(analysisInput);

    if (!result.success) {
      throw new Error(result.error?.message || 'Analysis failed');
    }

    // Transform to DetailedIdea format for Ideas PWA integration
    const detailedIdea = {
      id: `ai-${Date.now()}`,
      type: 'ai-generated' as const,
      title: idea.title,
      shortDescription: idea.description.substring(0, 200) + '...',
      category: idea.category || 'AI & Technology',
      difficulty: 'Medium',
      timeToMarket: '6-18 months',
      marketSize: result.marketResearch?.data?.problemStatement?.quantifiedImpact || 'TBD',
      
      // Comprehensive AI-generated analysis
      overview: {
        executiveSummary: result.marketResearch?.data?.problemStatement?.summary || '',
        keyInsights: [] as string[],
        confidenceScore: result.metadata.overallConfidence
      },

      marketAnalysis: {
        problemStatement: result.marketResearch?.data?.problemStatement || {},
        marketSignals: result.marketResearch?.data?.marketSignals || {},
        customerEvidence: result.marketResearch?.data?.customerEvidence || {},
        competitorAnalysis: result.marketResearch?.data?.competitorAnalysis || {},
        marketTiming: result.marketResearch?.data?.marketTiming || {}
      },

      financialModel: {
        revenue: {
          tamSamSom: result.financialModeling?.data?.tamSamSom || null,
          projections: result.financialModeling?.data?.revenueProjections || [],
          businessModel: result.financialModeling?.data?.scenarios || null
        },
        costs: {
          development: result.financialModeling?.data?.costAnalysis?.developmentCosts || [],
          operational: result.financialModeling?.data?.costAnalysis?.operationalCosts || [],
          marketing: result.financialModeling?.data?.costAnalysis?.marketingCosts || []
        },
        funding: {
          requirements: result.financialModeling?.data?.fundingRequirements || null,
          stages: result.financialModeling?.data?.fundingRequirements?.stages || [],
          investors: result.financialModeling?.data?.fundingRequirements?.investorTypes || []
        },
        metrics: {
          unitEconomics: result.financialModeling?.data?.costAnalysis?.unitEconomics || null,
          keyMetrics: result.financialModeling?.data?.keyMetrics || {}
        }
      },

      teamAndCosts: {
        founderFit: result.founderFit?.data?.scenarios || null,
        teamComposition: {
          coreTeam: [] as any[],
          advisors: [] as any[],
          skillsGap: [] as any[]
        },
        costs: {
          salaries: [] as any[],
          equity: [] as any[],
          timeline: [] as any[]
        },
        investment: {
          totalRequired: null,
          stages: [] as any[],
          useOfFunds: [] as any[]
        }
      },

      strategy: {
        goToMarket: null,
        competitive: result.marketResearch?.data?.competitiveIntelligence?.differentiationOpportunities || [],
        partnerships: [] as any[],
        scalability: result.financialModeling?.data?.scenarios?.optimistic || null
      },

      riskAssessment: {
        risks: result.riskAssessment?.data?.majorRiskCategories || [],
        mitigations: result.riskAssessment?.data?.mitigationStrategies || [],
        contingencyPlans: result.riskAssessment?.data?.riskScenarios || [],
        successFactors: result.riskAssessment?.data?.recommendations?.immediate || []
      }
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: detailedIdea,
        metadata: {
          requestId: result.requestId,
          processingTime: result.metadata.totalExecutionTime,
          agentsExecuted: result.metadata.agentsExecuted,
          agentsFailed: result.metadata.agentsFailed,
          overallConfidence: result.metadata.overallConfidence,
          qualityMetrics: result.qualityMetrics
        }
      })
    };

  } catch (error) {
    logger.error('Comprehensive analysis failed', { error });
    
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
 * Handle market research only analysis (for backward compatibility)
 */
async function handleMarketAnalysis(
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
    const analysisInput: BusinessIdeaAnalysisInput = {
      idea: {
        title: extractIdeaTitle(ideaText),
        description: ideaText,
        category: 'ai-automation',
        tier: 'ai-generated'
      },
      userContext: userContext || {},
      analysisDepth: 'standard',
      enabledAgents: {
        marketResearch: true,
        financialModeling: false,
        founderFit: false,
        riskAssessment: false
      }
    };

    const result = await orchestrator.analyzeBusiness(analysisInput);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: result.success,
        data: result.marketResearch?.data || null,
        metadata: {
          requestId: result.requestId,
          processingTime: result.metadata.totalExecutionTime,
          confidence: result.marketResearch?.metadata?.confidence || 0
        }
      })
    };

  } catch (error) {
    logger.error('Market analysis failed', { error });
    
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
    const health = orchestrator.getHealthStatus();
    const activeExecutions = orchestrator.getActiveExecutions();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: health.status,
        timestamp: new Date().toISOString(),
        agents: health.agents,
        providers: health.providers,
        activeExecutions: health.activeExecutions,
        version: '2.0.0',
        capabilities: {
          marketResearch: 'Production Ready',
          financialModeling: 'Production Ready', 
          founderFit: 'Production Ready',
          riskAssessment: 'Production Ready',
          orchestration: 'Comprehensive',
          dataSource: 'Free APIs Integrated'
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
}

/**
 * Extract a meaningful title from idea text
 */
function extractIdeaTitle(ideaText: string): string {
  // Enhanced title extraction
  const sentences = ideaText.split(/[.!?]/).filter(s => s.trim().length > 0);
  let title = sentences[0]?.trim() || ideaText.substring(0, 100);
  
  // Remove common prefixes
  title = title.replace(/^(An?|The|Create|Build|Develop)\s+/i, '');
  
  // Clean and truncate
  return title.length > 60 
    ? title.substring(0, 57) + '...'
    : title;
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
      const analysisInput: BusinessIdeaAnalysisInput = {
        idea: {
          title: args.input.title || extractIdeaTitle(args.input.ideaText),
          description: args.input.ideaText,
          category: args.input.category || 'ai-automation',
          tier: 'ai-generated'
        },
        userContext: args.input.userContext || {},
        analysisDepth: args.input.analysisDepth || 'comprehensive',
        enabledAgents: args.input.enabledAgents || {
          marketResearch: true,
          financialModeling: true,
          founderFit: true,
          riskAssessment: true
        }
      };

      const result = await orchestrator.analyzeBusiness(analysisInput);

      return {
        success: result.success,
        analysisId: result.requestId,
        marketResearch: result.marketResearch?.data || null,
        financialModeling: result.financialModeling?.data || null,
        founderFit: result.founderFit?.data || null,
        riskAssessment: result.riskAssessment?.data || null,
        overallConfidence: result.metadata.overallConfidence,
        qualityMetrics: result.qualityMetrics,
        executionTime: result.metadata.totalExecutionTime,
        agentsExecuted: result.metadata.agentsExecuted
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
import { z } from 'zod';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult,
  AgentStatus,
  AgentDependency,
  ValidationResult
} from '../types/agent';
import { BaseAgent } from '../core/BaseAgent';
import { LLMProvider, createLLMProvider } from '../providers/LLMProvider';
import { CacheProvider, createCacheProvider } from '../providers/CacheProvider';
import { DataSourceProvider, createDataSourceProvider } from '../providers/DataSourceProvider';
import { Logger, LogLevel } from '../utils/Logger';
import { MetricsCollector } from '../utils/MetricsCollector';

// Import specific agents
import { MarketResearchAgent, MarketResearchInput, MarketResearchOutput } from '../agents/MarketResearchAgent';

// Orchestrator configuration schema
const OrchestratorConfigSchema = z.object({
  llmProvider: z.object({
    type: z.enum(['claude', 'openai', 'mock']),
    apiKey: z.string().optional(),
  }),
  cacheProvider: z.object({
    type: z.enum(['redis', 'memory', 'none']),
    config: z.record(z.any()).optional(),
  }).optional(),
  dataSourceProviders: z.array(z.object({
    name: z.string(),
    type: z.enum(['google_trends', 'crunchbase', 'semrush', 'mock']),
    config: z.record(z.any()),
  })).optional(),
  logLevel: z.nativeEnum(LogLevel).default(LogLevel.INFO),
  enableMetrics: z.boolean().default(true),
});

export type OrchestratorConfig = z.infer<typeof OrchestratorConfigSchema>;

// Input schema for complete business idea analysis
const BusinessIdeaAnalysisInputSchema = z.object({
  idea: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum([
      'ai-automation', 'saas-tools', 'ecommerce', 'fintech',
      'healthtech', 'edtech', 'proptech', 'climate-tech',
      'creator-economy', 'web3-crypto'
    ]),
    tier: z.enum(['public', 'exclusive', 'ai-generated']),
  }),
  userContext: z.object({
    skills: z.array(z.string()).optional(),
    experience: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    budget: z.number().optional(),
    timeframe: z.string().optional(),
  }).optional(),
  analysisDepth: z.enum(['basic', 'standard', 'comprehensive']).default('standard'),
  enabledAgents: z.object({
    marketResearch: z.boolean().default(true),
    financialModeling: z.boolean().default(false), // Not implemented yet
    founderFit: z.boolean().default(false),         // Not implemented yet
    riskAssessment: z.boolean().default(false),     // Not implemented yet
  }).optional(),
});

export type BusinessIdeaAnalysisInput = z.infer<typeof BusinessIdeaAnalysisInputSchema>;

// Complete analysis output
export interface BusinessIdeaAnalysisOutput {
  success: boolean;
  requestId: string;
  
  // Agent results
  marketResearch?: AgentResult<MarketResearchOutput>;
  financialModeling?: AgentResult<any>;
  founderFit?: AgentResult<any>;
  riskAssessment?: AgentResult<any>;
  
  // Overall metadata
  metadata: {
    totalExecutionTime: number;
    agentsExecuted: string[];
    agentsFailed: string[];
    overallConfidence: number;
    dataFreshness: {
      timestamp: string;
      sources: string[];
    };
  };
  
  // Quality metrics
  qualityMetrics: {
    completeness: number;
    consistency: number;
    actionability: number;
    reliability: number;
  };
  
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class AgentOrchestrator {
  private config: OrchestratorConfig;
  private logger: Logger;
  private metricsCollector: MetricsCollector;
  
  // Infrastructure providers
  private llmProvider!: LLMProvider;
  private cacheProvider?: CacheProvider;
  private dataSourceProviders: Map<string, DataSourceProvider> = new Map();
  
  // Agent instances
  private agents: Map<string, BaseAgent> = new Map();
  
  // Execution tracking
  private activeExecutions: Map<string, {
    startTime: number;
    agentStatuses: Map<string, AgentStatus>;
  }> = new Map();

  constructor(config: OrchestratorConfig) {
    this.config = OrchestratorConfigSchema.parse(config);
    this.logger = new Logger('orchestrator', this.config.logLevel);
    this.metricsCollector = new MetricsCollector('orchestrator');
    
    this.initializeProviders();
    this.initializeAgents();
  }

  private initializeProviders(): void {
    // Initialize LLM provider
    this.llmProvider = createLLMProvider(
      this.config.llmProvider.type,
      this.config.llmProvider.apiKey
    );
    
    // Initialize cache provider
    if (this.config.cacheProvider) {
      this.cacheProvider = createCacheProvider(
        this.config.cacheProvider.type,
        this.config.cacheProvider.config
      );
    }
    
    // Initialize data source providers
    if (this.config.dataSourceProviders) {
      this.config.dataSourceProviders.forEach(providerConfig => {
        const provider = createDataSourceProvider(
          providerConfig.type,
          {
            name: providerConfig.name,
            timeout: 10000,
            enabled: true,
            ...providerConfig.config
          }
        );
        this.dataSourceProviders.set(providerConfig.name, provider);
      });
    }
  }

  private initializeAgents(): void {
    // Market Research Agent
    const marketResearchConfig: AgentConfig = {
      agentId: 'market-research',
      name: 'Market Research Agent',
      version: '1.0.0',
      llmProvider: this.config.llmProvider.type,
      maxTokens: 4000,
      temperature: 0.3,
      timeout: 60,
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
    };

    const marketResearchAgent = new MarketResearchAgent(
      marketResearchConfig,
      this.llmProvider,
      this.cacheProvider,
      this.dataSourceProviders.get('market_data')
    );

    this.agents.set('market-research', marketResearchAgent);
    
    // TODO: Add other agents when implemented
    // - FinancialModelingAgent
    // - FounderFitAgent  
    // - RiskAssessmentAgent
  }

  /**
   * Main orchestration method - analyzes a business idea using enabled agents
   */
  public async analyzeBusiness(
    input: BusinessIdeaAnalysisInput
  ): Promise<BusinessIdeaAnalysisOutput> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    this.logger.info(`Starting business analysis for: ${input.idea.title}`, { requestId });
    
    // Initialize execution tracking
    this.activeExecutions.set(requestId, {
      startTime,
      agentStatuses: new Map(),
    });

    try {
      // Validate input
      const inputValidation = this.validateInput(input);
      if (!inputValidation.isValid) {
        throw new Error(`Input validation failed: ${inputValidation.errors.map(e => e.message).join(', ')}`);
      }

      // Create agent context
      const context: AgentContext = {
        requestId,
        userId: 'anonymous', // TODO: Add user authentication
        analysisDepth: input.analysisDepth,
        userContext: input.userContext,
      };

      // Execute enabled agents
      const results: Partial<BusinessIdeaAnalysisOutput> = {
        success: true,
        requestId,
      };

      const agentsExecuted: string[] = [];
      const agentsFailed: string[] = [];
      let totalConfidence = 0;
      let agentCount = 0;

      // Execute Market Research Agent
      if (input.enabledAgents?.marketResearch !== false) {
        try {
          this.logger.info('Executing Market Research Agent', { requestId });
          
          const marketResearchInput: MarketResearchInput = {
            title: input.idea.title,
            description: input.idea.description,
            category: input.idea.category,
            tier: input.idea.tier,
          };

          const marketResearchAgent = this.agents.get('market-research') as MarketResearchAgent;
          const marketResult = await marketResearchAgent.execute(marketResearchInput, context);
          
          results.marketResearch = marketResult;
          agentsExecuted.push('market-research');
          
          if (marketResult.success && marketResult.metadata.confidence) {
            totalConfidence += marketResult.metadata.confidence;
            agentCount++;
          }
          
        } catch (error) {
          this.logger.error('Market Research Agent failed', error as Error, { requestId });
          agentsFailed.push('market-research');
          results.marketResearch = {
            success: false,
            error: {
              code: 'MARKET_RESEARCH_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            metadata: {
              agentId: 'market-research',
              version: '1.0.0',
              timestamp: new Date().toISOString(),
              metrics: {
                executionTime: Date.now() - startTime,
                tokensUsed: 0,
                apiCalls: 0,
                cacheHits: 0,
                cacheMisses: 0,
                errorCount: 1,
                qualityScore: 0,
              },
              confidence: 0,
            },
          };
        }
      }

      // TODO: Execute other agents when implemented
      // if (input.enabledAgents?.financialModeling) { ... }
      // if (input.enabledAgents?.founderFit) { ... }
      // if (input.enabledAgents?.riskAssessment) { ... }

      // Calculate overall metrics
      const totalExecutionTime = Date.now() - startTime;
      const overallConfidence = agentCount > 0 ? totalConfidence / agentCount : 0;
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(results);

      // Build final result
      const finalResult: BusinessIdeaAnalysisOutput = {
        ...results,
        success: agentsFailed.length === 0,
        metadata: {
          totalExecutionTime,
          agentsExecuted,
          agentsFailed,
          overallConfidence,
          dataFreshness: {
            timestamp: new Date().toISOString(),
            sources: Array.from(this.dataSourceProviders.keys()),
          },
        },
        qualityMetrics,
      };

      // Clean up execution tracking
      this.activeExecutions.delete(requestId);
      
      // Record metrics
      if (this.config.enableMetrics) {
        this.metricsCollector.recordExecution({
          executionTime: totalExecutionTime,
          tokensUsed: this.calculateTotalTokens(results),
          apiCalls: agentsExecuted.length,
          cacheHits: 0, // TODO: Aggregate from agent results
          cacheMisses: 0,
          errorCount: agentsFailed.length,
          qualityScore: qualityMetrics.reliability,
        }, requestId);
      }

      this.logger.info(`Business analysis completed for: ${input.idea.title}`, {
        requestId,
        executionTime: totalExecutionTime,
        agentsExecuted,
        overallConfidence,
      });

      return finalResult;

    } catch (error) {
      const totalExecutionTime = Date.now() - startTime;
      
      this.logger.error(`Business analysis failed for: ${input.idea.title}`, error as Error, { requestId });
      
      // Clean up execution tracking
      this.activeExecutions.delete(requestId);
      
      // Record error metrics
      if (this.config.enableMetrics) {
        this.metricsCollector.recordError(error as Error, {
          executionTime: totalExecutionTime,
          tokensUsed: 0,
          apiCalls: 0,
          cacheHits: 0,
          cacheMisses: 0,
          errorCount: 1,
          qualityScore: 0,
        }, requestId);
      }

      return {
        success: false,
        requestId,
        error: {
          code: 'ORCHESTRATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          totalExecutionTime,
          agentsExecuted: [],
          agentsFailed: ['orchestrator'],
          overallConfidence: 0,
          dataFreshness: {
            timestamp: new Date().toISOString(),
            sources: [],
          },
        },
        qualityMetrics: {
          completeness: 0,
          consistency: 0,
          actionability: 0,
          reliability: 0,
        },
      };
    }
  }

  /**
   * Get current status of all active executions
   */
  public getActiveExecutions(): Array<{
    requestId: string;
    executionTime: number;
    agentStatuses: Record<string, AgentStatus>;
  }> {
    const now = Date.now();
    return Array.from(this.activeExecutions.entries()).map(([requestId, execution]) => ({
      requestId,
      executionTime: now - execution.startTime,
      agentStatuses: Object.fromEntries(execution.agentStatuses.entries()),
    }));
  }

  /**
   * Get health status of the orchestrator
   */
  public getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    agents: Record<string, 'ready' | 'busy' | 'error'>;
    providers: {
      llm: boolean;
      cache: boolean;
      dataSources: Record<string, boolean>;
    };
    activeExecutions: number;
  } {
    // Test provider health
    const providers = {
      llm: true, // LLM providers don't typically have health checks
      cache: this.cacheProvider !== undefined,
      dataSources: Object.fromEntries(
        Array.from(this.dataSourceProviders.entries()).map(([name]) => [name, true])
      ),
    };

    // Check agent status
    const agents: Record<string, 'ready' | 'busy' | 'error'> = {};
    this.agents.forEach((agent, name) => {
      agents[name] = agent.getStatus() === AgentStatus.PROCESSING ? 'busy' : 'ready';
    });

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const activeCount = this.activeExecutions.size;
    
    if (activeCount > 10) {
      status = 'warning';
    }
    if (activeCount > 50) {
      status = 'critical';
    }

    return {
      status,
      agents,
      providers,
      activeExecutions: activeCount,
    };
  }

  private validateInput(input: BusinessIdeaAnalysisInput): ValidationResult {
    try {
      BusinessIdeaAnalysisInputSchema.parse(input);
      return {
        isValid: true,
        errors: [],
        confidence: 100,
        suggestions: [],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            severity: 'error' as const,
          })),
          confidence: 0,
          suggestions: ['Ensure all required fields are provided with valid values'],
        };
      }
      
      return {
        isValid: false,
        errors: [{
          field: 'input',
          message: 'Invalid input format',
          severity: 'error',
        }],
        confidence: 0,
        suggestions: ['Check input data structure'],
      };
    }
  }

  private calculateQualityMetrics(
    results: Partial<BusinessIdeaAnalysisOutput>
  ): BusinessIdeaAnalysisOutput['qualityMetrics'] {
    let totalScore = 0;
    let metricCount = 0;

    // Completeness: How much data was generated
    let completeness = 0;
    if (results.marketResearch?.success) {
      completeness += 25;
      if (results.marketResearch.data?.customerEvidence?.length >= 2) completeness += 25;
      if (results.marketResearch.data?.marketSignals?.length >= 3) completeness += 25;
      if (results.marketResearch.data?.competitorAnalysis?.length >= 2) completeness += 25;
    }

    // Consistency: Cross-agent data alignment (placeholder for now)
    const consistency = results.marketResearch?.success ? 85 : 0;

    // Actionability: How actionable the insights are
    let actionability = 0;
    if (results.marketResearch?.success && results.marketResearch.data) {
      const mr = results.marketResearch.data;
      if (mr.problemStatement?.quantifiedImpact) actionability += 20;
      if (mr.customerEvidence?.some(e => e.willingnessToPay)) actionability += 20;
      if (mr.competitorAnalysis?.some(c => c.differentiationOpportunity)) actionability += 20;
      if (mr.marketTiming?.catalysts?.length >= 3) actionability += 20;
      if (mr.confidence?.overall >= 70) actionability += 20;
    }

    // Reliability: Based on confidence scores and error rates
    const reliability = results.marketResearch?.success 
      ? (results.marketResearch.metadata.confidence || 0)
      : 0;

    return {
      completeness,
      consistency,
      actionability,
      reliability,
    };
  }

  private calculateTotalTokens(results: Partial<BusinessIdeaAnalysisOutput>): number {
    let total = 0;
    
    if (results.marketResearch?.metadata.metrics.tokensUsed) {
      total += results.marketResearch.metadata.metrics.tokensUsed;
    }
    
    // TODO: Add other agents when implemented
    
    return total;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Cleanup method to properly close providers
   */
  public async cleanup(): Promise<void> {
    this.logger.info('Cleaning up orchestrator');
    
    // Clear active executions
    this.activeExecutions.clear();
    
    // Cleanup cache provider if it supports it
    if (this.cacheProvider && 'disconnect' in this.cacheProvider) {
      try {
        await (this.cacheProvider as any).disconnect();
      } catch (error) {
        this.logger.warn('Cache provider cleanup error', error as Error);
      }
    }
    
    this.logger.info('Orchestrator cleanup completed');
  }
}

/**
 * Factory function to create a pre-configured orchestrator
 */
export function createAgentOrchestrator(config: OrchestratorConfig): AgentOrchestrator {
  return new AgentOrchestrator(config);
}

/**
 * Create a development-friendly orchestrator with mock providers
 */
export function createDevelopmentOrchestrator(): AgentOrchestrator {
  const config: OrchestratorConfig = {
    llmProvider: {
      type: 'mock',
    },
    cacheProvider: {
      type: 'memory',
    },
    dataSourceProviders: [
      {
        name: 'market_data',
        type: 'mock',
        config: {},
      },
    ],
    logLevel: LogLevel.INFO,
    enableMetrics: true,
  };

  return createAgentOrchestrator(config);
}
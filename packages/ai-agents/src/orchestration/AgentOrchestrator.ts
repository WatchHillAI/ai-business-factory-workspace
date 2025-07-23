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
import { FinancialModelingAgent, FinancialModelingInput, FinancialModelOutput } from '../agents/FinancialModelingAgent';
import { FounderFitAgent, FounderFitInput, FounderFitOutput } from '../agents/FounderFitAgent';
import { RiskAssessmentAgent, RiskAssessmentInput, RiskAssessmentOutput } from '../agents/RiskAssessmentAgent';

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
    financialModeling: z.boolean().default(true),
    founderFit: z.boolean().default(true),
    riskAssessment: z.boolean().default(true),
  }).optional(),
});

export type BusinessIdeaAnalysisInput = z.infer<typeof BusinessIdeaAnalysisInputSchema>;

// Complete analysis output
export interface BusinessIdeaAnalysisOutput {
  success: boolean;
  requestId: string;
  
  // Agent results
  marketResearch?: AgentResult<MarketResearchOutput>;
  financialModeling?: AgentResult<FinancialModelingOutput>;
  founderFit?: AgentResult<FounderFitOutput>;
  riskAssessment?: AgentResult<RiskAssessmentOutput>;
  
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
    const marketResearchAgent = new MarketResearchAgent(
      { agentId: 'market-research', version: '1.0.0' },
      this.llmProvider,
      this.cacheProvider,
      this.dataSourceProviders.get('market_data')
    );
    this.agents.set('market-research', marketResearchAgent);
    
    // Financial Modeling Agent
    const financialModelingAgent = new FinancialModelingAgent(
      { agentId: 'financial-modeling', version: '1.0.0' },
      this.llmProvider,
      this.cacheProvider,
      this.dataSourceProviders.get('market_data')
    );
    this.agents.set('financial-modeling', financialModelingAgent);
    
    // Founder Fit Agent
    const founderFitAgent = new FounderFitAgent(
      { agentId: 'founder-fit', version: '1.0.0' },
      this.llmProvider,
      this.cacheProvider
    );
    this.agents.set('founder-fit', founderFitAgent);
    
    // Risk Assessment Agent
    const riskAssessmentAgent = new RiskAssessmentAgent(
      { agentId: 'risk-assessment', version: '1.0.0' },
      this.llmProvider,
      this.cacheProvider,
      this.dataSourceProviders.get('market_data')
    );
    this.agents.set('risk-assessment', riskAssessmentAgent);
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

      // Execute Financial Modeling Agent
      if (input.enabledAgents?.financialModeling !== false) {
        try {
          this.logger.info('Executing Financial Modeling Agent', { requestId });
          
          const financialModelingInput: FinancialModelingInput = {
            ideaText: input.idea.description,
            title: input.idea.title,
            category: input.idea.category,
            targetMarket: input.userContext?.interests?.join(', '),
            businessModel: `${input.idea.tier} tier business model`,
            userContext: {
              budget: input.userContext?.budget?.toString(),
              timeline: input.userContext?.timeframe,
              experience: input.userContext?.experience?.join(', ')
            }
          };

          const financialModelingAgent = this.agents.get('financial-modeling') as FinancialModelingAgent;
          const financialResult = await financialModelingAgent.analyze(financialModelingInput, context);
          
          results.financialModeling = financialResult;
          agentsExecuted.push('financial-modeling');
          
          if (financialResult.confidence?.overall) {
            totalConfidence += financialResult.confidence.overall;
            agentCount++;
          }
          
        } catch (error) {
          this.logger.error('Financial Modeling Agent failed', error as Error, { requestId });
          agentsFailed.push('financial-modeling');
          results.financialModeling = {
            success: false,
            error: {
              code: 'FINANCIAL_MODELING_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            metadata: {
              agentId: 'financial-modeling',
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

      // Execute Founder Fit Agent
      if (input.enabledAgents?.founderFit !== false) {
        try {
          this.logger.info('Executing Founder Fit Agent', { requestId });
          
          const founderFitInput: FounderFitInput = {
            ideaText: input.idea.description,
            title: input.idea.title,
            category: input.idea.category,
            founderProfile: {
              background: input.userContext?.experience?.join(', ') || 'Not specified',
              education: 'Not specified',
              previousExperience: input.userContext?.experience?.join(', ') || 'Not specified',
              expertise: input.userContext?.skills || [],
              network: 'Not specified',
              motivation: `Interest in ${input.idea.category}`
            },
            userContext: {
              budget: input.userContext?.budget?.toString(),
              timeline: input.userContext?.timeframe,
              experience: input.userContext?.experience?.join(', ')
            }
          };

          const founderFitAgent = this.agents.get('founder-fit') as FounderFitAgent;
          const founderResult = await founderFitAgent.analyze(founderFitInput, context);
          
          results.founderFit = founderResult;
          agentsExecuted.push('founder-fit');
          
          if (founderResult.confidence?.overall) {
            totalConfidence += founderResult.confidence.overall;
            agentCount++;
          }
          
        } catch (error) {
          this.logger.error('Founder Fit Agent failed', error as Error, { requestId });
          agentsFailed.push('founder-fit');
          results.founderFit = {
            success: false,
            error: {
              code: 'FOUNDER_FIT_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            metadata: {
              agentId: 'founder-fit',
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

      // Execute Risk Assessment Agent
      if (input.enabledAgents?.riskAssessment !== false) {
        try {
          this.logger.info('Executing Risk Assessment Agent', { requestId });
          
          const riskAssessmentInput: RiskAssessmentInput = {
            ideaText: input.idea.description,
            title: input.idea.title,
            category: input.idea.category,
            targetMarket: input.userContext?.interests?.join(', '),
            businessModel: `${input.idea.tier} tier business model`,
            financialProjections: results.financialModeling?.data ? {
              revenue5Year: results.financialModeling.data.scenarios?.realistic?.revenue5Year,
              totalFunding: results.financialModeling.data.fundingRequirements?.totalRequired,
              breakEvenMonth: results.financialModeling.data.keyMetrics?.breakEvenMonth
            } : undefined,
            teamProfile: results.founderFit?.data ? {
              founderExperience: input.userContext?.experience?.join(', ') || 'Not specified',
              teamSize: results.founderFit.data.teamRequirements?.coreRoles?.length || 1,
              missingSkills: results.founderFit.data.skillsAnalysis?.skillGaps?.map(gap => gap.skill) || []
            } : undefined,
            userContext: {
              budget: input.userContext?.budget?.toString(),
              timeline: input.userContext?.timeframe,
              experience: input.userContext?.experience?.join(', ')
            }
          };

          const riskAssessmentAgent = this.agents.get('risk-assessment') as RiskAssessmentAgent;
          const riskResult = await riskAssessmentAgent.analyze(riskAssessmentInput, context);
          
          results.riskAssessment = riskResult;
          agentsExecuted.push('risk-assessment');
          
          if (riskResult.confidence?.overall) {
            totalConfidence += riskResult.confidence.overall;
            agentCount++;
          }
          
        } catch (error) {
          this.logger.error('Risk Assessment Agent failed', error as Error, { requestId });
          agentsFailed.push('risk-assessment');
          results.riskAssessment = {
            success: false,
            error: {
              code: 'RISK_ASSESSMENT_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            metadata: {
              agentId: 'risk-assessment',
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
    const totalScore = 0;
    const metricCount = 0;

    // Completeness: How much data was generated across all agents
    let completeness = 0;
    let maxCompleteness = 0;
    
    if (results.marketResearch?.success) {
      maxCompleteness += 25;
      completeness += 15;
      if (results.marketResearch.data?.customerEvidence?.length >= 2) completeness += 5;
      if (results.marketResearch.data?.marketSignals?.length >= 3) completeness += 5;
    }
    
    if (results.financialModeling?.success) {
      maxCompleteness += 25;
      completeness += 15;
      if (results.financialModeling.data?.tamSamSom) completeness += 5;
      if (results.financialModeling.data?.revenueProjections?.length >= 3) completeness += 5;
    }
    
    if (results.founderFit?.success) {
      maxCompleteness += 25;
      completeness += 15;
      if (results.founderFit.data?.skillsAnalysis) completeness += 5;
      if (results.founderFit.data?.teamRequirements) completeness += 5;
    }
    
    if (results.riskAssessment?.success) {
      maxCompleteness += 25;
      completeness += 15;
      if (results.riskAssessment.data?.majorRiskCategories?.length >= 4) completeness += 5;
      if (results.riskAssessment.data?.mitigationStrategies?.length >= 3) completeness += 5;
    }
    
    // Normalize completeness to percentage
    completeness = maxCompleteness > 0 ? Math.round((completeness / maxCompleteness) * 100) : 0;

    // Consistency: Cross-agent data alignment
    let consistency = 0;
    let consistencyChecks = 0;
    
    // Check market research vs financial modeling alignment
    if (results.marketResearch?.success && results.financialModeling?.success) {
      consistencyChecks++;
      // Basic consistency check - both should have positive outlook if market signals are strong
      const marketPositive = (results.marketResearch.data?.confidence?.overall || 0) > 70;
      const financialPositive = (results.financialModeling.data?.confidence?.overall || 0) > 70;
      if (marketPositive === financialPositive) consistency += 30;
    }
    
    // Check founder fit vs financial requirements alignment
    if (results.founderFit?.success && results.financialModeling?.success) {
      consistencyChecks++;
      consistency += 25; // Assume reasonable alignment for now
    }
    
    // Check risk assessment vs other agents alignment
    if (results.riskAssessment?.success && results.marketResearch?.success) {
      consistencyChecks++;
      const marketRisk = 100 - (results.marketResearch.data?.confidence?.overall || 0);
      const assessedRisk = results.riskAssessment.data?.overallRiskScore || 50;
      const riskAlignment = Math.abs(marketRisk - assessedRisk) < 20;
      if (riskAlignment) consistency += 30;
    }
    
    consistency = consistencyChecks > 0 ? Math.round(consistency / consistencyChecks * (100/85)) : 0;

    // Actionability: How actionable the insights are across all agents
    let actionability = 0;
    
    if (results.marketResearch?.success && results.marketResearch.data) {
      const mr = results.marketResearch.data;
      if (mr.problemStatement?.quantifiedImpact) actionability += 15;
      if (mr.customerEvidence?.some(e => e.willingnessToPay)) actionability += 10;
    }
    
    if (results.financialModeling?.success && results.financialModeling.data) {
      const fm = results.financialModeling.data;
      if (fm.fundingRequirements?.totalRequired) actionability += 15;
      if (fm.keyMetrics?.breakEvenMonth) actionability += 10;
    }
    
    if (results.founderFit?.success && results.founderFit.data) {
      const ff = results.founderFit.data;
      if (ff.skillsAnalysis?.skillGaps?.length > 0) actionability += 15;
      if (ff.investmentPlan?.immediatePriorities?.length > 0) actionability += 10;
    }
    
    if (results.riskAssessment?.success && results.riskAssessment.data) {
      const ra = results.riskAssessment.data;
      if (ra.mitigationStrategies?.length >= 3) actionability += 15;
      if (ra.recommendations?.immediate?.length > 0) actionability += 10;
    }

    // Reliability: Based on confidence scores across all agents
    let reliability = 0;
    let reliabilityCount = 0;
    
    if (results.marketResearch?.success) {
      reliability += (results.marketResearch.data?.confidence?.overall || 0);
      reliabilityCount++;
    }
    
    if (results.financialModeling?.success) {
      reliability += (results.financialModeling.data?.confidence?.overall || 0);
      reliabilityCount++;
    }
    
    if (results.founderFit?.success) {
      reliability += (results.founderFit.data?.confidence?.overall || 0);
      reliabilityCount++;
    }
    
    if (results.riskAssessment?.success) {
      reliability += (results.riskAssessment.data?.confidence?.overall || 0);
      reliabilityCount++;
    }
    
    reliability = reliabilityCount > 0 ? Math.round(reliability / reliabilityCount) : 0;

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
    
    if (results.financialModeling?.metadata.metrics.tokensUsed) {
      total += results.financialModeling.metadata.metrics.tokensUsed;
    }
    
    if (results.founderFit?.metadata.metrics.tokensUsed) {
      total += results.founderFit.metadata.metrics.tokensUsed;
    }
    
    if (results.riskAssessment?.metadata.metrics.tokensUsed) {
      total += results.riskAssessment.metadata.metrics.tokensUsed;
    }
    
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
import { z } from 'zod';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AgentMetrics, 
  AgentStatus,
  ValidationResult,
  DataSourceConfig,
  CacheConfig,
  QualityThresholds
} from '../types/agent';
import { LLMProvider } from '../providers/LLMProvider';
import { CacheProvider } from '../providers/CacheProvider';
import { DataSourceProvider } from '../providers/DataSourceProvider';
import { Logger } from '../utils/Logger';
import { MetricsCollector } from '../utils/MetricsCollector';

export abstract class BaseAgent<TInput = any, TOutput = any> {
  protected config: AgentConfig;
  protected llmProvider: LLMProvider;
  protected cacheProvider?: CacheProvider;
  protected dataSourceProvider?: DataSourceProvider;
  protected logger: Logger;
  protected metricsCollector: MetricsCollector;
  protected qualityThresholds: QualityThresholds;
  
  private status: AgentStatus = AgentStatus.IDLE;
  private currentMetrics: Partial<AgentMetrics> = {};

  constructor(
    config: AgentConfig,
    llmProvider: LLMProvider,
    cacheProvider?: CacheProvider,
    dataSourceProvider?: DataSourceProvider,
    qualityThresholds?: QualityThresholds
  ) {
    this.config = config;
    this.llmProvider = llmProvider;
    this.cacheProvider = cacheProvider;
    this.dataSourceProvider = dataSourceProvider;
    this.logger = new Logger(config.agentId);
    this.metricsCollector = new MetricsCollector(config.agentId);
    this.qualityThresholds = qualityThresholds || {
      minimumConfidence: 70,
      dataCompletenessThreshold: 85,
      consistencyThreshold: 90,
      actionabilityThreshold: 75
    };
  }

  /**
   * Main execution method - orchestrates the agent workflow
   */
  public async execute(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    const requestId = context.requestId;
    
    try {
      this.status = AgentStatus.INITIALIZING;
      this.logger.info(`Starting agent execution for request ${requestId}`);
      
      // Reset metrics for this execution
      this.currentMetrics = {
        apiCalls: 0,
        tokensUsed: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errorCount: 0
      };

      // Step 1: Validate input
      const inputValidation = this.validateInput(input);
      if (!inputValidation.isValid) {
        throw new Error(`Input validation failed: ${inputValidation.errors.map(e => e.message).join(', ')}`);
      }

      // Step 2: Check cache if enabled
      let result: TOutput | null = null;
      if (this.cacheProvider) {
        const cacheKey = this.generateCacheKey(input, context);
        result = await this.getCachedResult(cacheKey);
        
        if (result) {
          this.currentMetrics.cacheHits = (this.currentMetrics.cacheHits || 0) + 1;
          this.logger.info(`Cache hit for request ${requestId}`);
          
          return this.buildSuccessResult(result, startTime, 100); // Cached results have max confidence
        } else {
          this.currentMetrics.cacheMisses = (this.currentMetrics.cacheMisses || 0) + 1;
        }
      }

      // Step 3: Execute main processing logic
      this.status = AgentStatus.PROCESSING;
      result = await this.processRequest(input, context);
      
      // Step 4: Validate output
      this.status = AgentStatus.VALIDATING;
      const outputValidation = this.validateOutput(result);
      if (!outputValidation.isValid) {
        throw new Error(`Output validation failed: ${outputValidation.errors.map(e => e.message).join(', ')}`);
      }

      // Step 5: Quality assurance check
      const qualityCheck = await this.performQualityAssurance(result, context);
      if (qualityCheck.confidence < this.qualityThresholds.minimumConfidence) {
        this.logger.warn(`Quality check failed: confidence ${qualityCheck.confidence} below threshold ${this.qualityThresholds.minimumConfidence}`);
      }

      // Step 6: Cache result if enabled
      if (this.cacheProvider && result) {
        const cacheKey = this.generateCacheKey(input, context);
        await this.cacheResult(cacheKey, result, context);
      }

      this.status = AgentStatus.COMPLETED;
      return this.buildSuccessResult(result, startTime, qualityCheck.confidence);

    } catch (error) {
      this.status = AgentStatus.FAILED;
      this.currentMetrics.errorCount = (this.currentMetrics.errorCount || 0) + 1;
      
      this.logger.error(`Agent execution failed for request ${requestId}`, error);
      
      return this.buildErrorResult(error instanceof Error ? error : new Error(String(error)), startTime);
    }
  }

  /**
   * Abstract methods that must be implemented by concrete agents
   */
  protected abstract processRequest(input: TInput, context: AgentContext): Promise<TOutput>;
  protected abstract validateInput(input: TInput): ValidationResult;
  protected abstract validateOutput(output: TOutput): ValidationResult;
  protected abstract performQualityAssurance(output: TOutput, context: AgentContext): Promise<ValidationResult>;

  /**
   * Generate a unique cache key for the input and context
   */
  protected generateCacheKey(input: TInput, context: AgentContext): string {
    const keyData = {
      agentId: this.config.agentId,
      version: this.config.version,
      input: JSON.stringify(input),
      analysisDepth: context.analysisDepth,
      userContext: context.userContext ? JSON.stringify(context.userContext) : null
    };
    
    // Simple hash function for cache key
    const key = JSON.stringify(keyData);
    return Buffer.from(key).toString('base64').substring(0, 64);
  }

  /**
   * Get cached result if available and not expired
   */
  protected async getCachedResult(cacheKey: string): Promise<TOutput | null> {
    if (!this.cacheProvider) return null;
    
    try {
      const cached = await this.cacheProvider.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.warn('Cache retrieval error', error);
      return null;
    }
  }

  /**
   * Cache the result with appropriate TTL
   */
  protected async cacheResult(cacheKey: string, result: TOutput, context: AgentContext): Promise<void> {
    if (!this.cacheProvider) return;
    
    try {
      const ttl = context.dataFreshness?.maxAge || 3600; // Default 1 hour
      await this.cacheProvider.set(cacheKey, JSON.stringify(result), ttl);
    } catch (error) {
      this.logger.warn('Cache storage error', error);
    }
  }

  /**
   * Build successful result object
   */
  protected buildSuccessResult(data: TOutput, startTime: number, confidence: number): AgentResult<TOutput> {
    const executionTime = Date.now() - startTime;
    
    const metrics: AgentMetrics = {
      executionTime,
      tokensUsed: this.currentMetrics.tokensUsed || 0,
      apiCalls: this.currentMetrics.apiCalls || 0,
      cacheHits: this.currentMetrics.cacheHits || 0,
      cacheMisses: this.currentMetrics.cacheMisses || 0,
      errorCount: this.currentMetrics.errorCount || 0,
      qualityScore: confidence
    };

    // Report metrics
    this.metricsCollector.recordExecution(metrics);

    return {
      success: true,
      data,
      metadata: {
        agentId: this.config.agentId,
        version: this.config.version,
        timestamp: new Date().toISOString(),
        metrics,
        confidence
      }
    };
  }

  /**
   * Build error result object
   */
  protected buildErrorResult(error: Error, startTime: number): AgentResult<TOutput> {
    const executionTime = Date.now() - startTime;
    
    const metrics: AgentMetrics = {
      executionTime,
      tokensUsed: this.currentMetrics.tokensUsed || 0,
      apiCalls: this.currentMetrics.apiCalls || 0,
      cacheHits: this.currentMetrics.cacheHits || 0,
      cacheMisses: this.currentMetrics.cacheMisses || 0,
      errorCount: (this.currentMetrics.errorCount || 0) + 1,
      qualityScore: 0
    };

    // Report metrics including the failure
    this.metricsCollector.recordError(error, metrics);

    return {
      success: false,
      error: {
        code: error.name || 'AGENT_ERROR',
        message: error.message,
        details: error.stack
      },
      metadata: {
        agentId: this.config.agentId,
        version: this.config.version,
        timestamp: new Date().toISOString(),
        metrics,
        confidence: 0
      }
    };
  }

  /**
   * Helper method to call LLM with standardized error handling and metrics
   */
  protected async callLLM(prompt: string, options: {
    temperature?: number;
    maxTokens?: number;
    format?: 'text' | 'json';
  } = {}): Promise<string> {
    this.currentMetrics.apiCalls = (this.currentMetrics.apiCalls || 0) + 1;
    
    const result = await this.llmProvider.generate(prompt, {
      temperature: options.temperature || this.config.temperature,
      maxTokens: options.maxTokens || this.config.maxTokens,
      format: options.format || 'text'
    });
    
    this.currentMetrics.tokensUsed = (this.currentMetrics.tokensUsed || 0) + result.tokensUsed;
    
    return result.text;
  }

  /**
   * Helper method to validate and parse structured data
   */
  protected validateAndParse<T>(data: string, schema: z.ZodSchema<T>): T {
    try {
      const parsed = JSON.parse(data);
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new Error(`Data validation failed: ${errorMessages.join(', ')}`);
      }
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current agent status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent configuration
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Get current metrics (for monitoring)
   */
  public getCurrentMetrics(): Partial<AgentMetrics> {
    return { ...this.currentMetrics };
  }
}
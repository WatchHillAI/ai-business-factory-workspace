import { z } from 'zod';

// Core agent configuration
export const AgentConfigSchema = z.object({
  agentId: z.string(),
  name: z.string(),
  version: z.string(),
  llmProvider: z.enum(['claude', 'openai', 'gemini', 'mock']),
  maxTokens: z.number().default(4000),
  temperature: z.number().min(0).max(2).default(0.3),
  timeout: z.number().default(60),
  retryConfig: z.object({
    maxRetries: z.number().default(3),
    backoffMultiplier: z.number().default(2),
    initialDelay: z.number().default(1000),
  }),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Agent execution context
export const AgentContextSchema = z.object({
  requestId: z.string(),
  userId: z.string().optional(),
  analysisDepth: z.enum(['basic', 'standard', 'comprehensive']).default('standard'),
  userContext: z.object({
    skills: z.array(z.string()).optional(),
    experience: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    budget: z.number().optional(),
    timeframe: z.string().optional(),
  }).optional(),
  dataFreshness: z.object({
    maxAge: z.number().default(86400), // 24 hours in seconds
    forceRefresh: z.boolean().default(false),
  }).optional(),
});

export type AgentContext = z.infer<typeof AgentContextSchema>;

// Agent performance metrics
export const AgentMetricsSchema = z.object({
  executionTime: z.number(),
  tokensUsed: z.number(),
  apiCalls: z.number(),
  cacheHits: z.number(),
  cacheMisses: z.number(),
  errorCount: z.number(),
  qualityScore: z.number().min(0).max(100),
});

export type AgentMetrics = z.infer<typeof AgentMetricsSchema>;

// Base agent result interface
export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    agentId: string;
    version: string;
    timestamp: string;
    metrics: AgentMetrics;
    confidence: number; // 0-100 confidence score
  };
}

// Validation result structure
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
  })),
  confidence: z.number().min(0).max(100),
  suggestions: z.array(z.string()),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// Data source configuration
export const DataSourceConfigSchema = z.object({
  name: z.string(),
  type: z.enum(['api', 'database', 'web_scraper', 'static']),
  endpoint: z.string().optional(),
  credentials: z.record(z.string()).optional(),
  rateLimits: z.object({
    requests: z.number(),
    period: z.enum(['second', 'minute', 'hour', 'day']),
  }).optional(),
  timeout: z.number().default(10000),
  enabled: z.boolean().default(true),
});

export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;

// Cache configuration
export const CacheConfigSchema = z.object({
  provider: z.enum(['redis', 'memory', 'none']),
  ttl: z.number().default(3600), // 1 hour default
  keyPrefix: z.string().default('ai-agent'),
  compression: z.boolean().default(true),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

// Quality assurance thresholds
export const QualityThresholdsSchema = z.object({
  minimumConfidence: z.number().min(0).max(100).default(70),
  dataCompletenessThreshold: z.number().min(0).max(100).default(85),
  consistencyThreshold: z.number().min(0).max(100).default(90),
  actionabilityThreshold: z.number().min(0).max(100).default(75),
});

export type QualityThresholds = z.infer<typeof QualityThresholdsSchema>;

// Agent status tracking
export enum AgentStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing', 
  PROCESSING = 'processing',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

// Agent dependency graph
export interface AgentDependency {
  agentId: string;
  required: boolean;
  waitForCompletion: boolean;
  dataMapping?: Record<string, string>; // Map output fields to input fields
}
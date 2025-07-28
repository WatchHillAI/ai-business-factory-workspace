// Core business types
export interface MarketData {
  id?: string;
  source: string;
  url: string;
  title: string;
  content: string;
  tags: string[];
  sentiment: number;
  relevanceScore: number;
  scrapedAt: Date;
  strategyId?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  marketSize: number;
  competitionLevel: number;
  implementationDifficulty: number;
  score: number;
  tags: string[];
  sources: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'discovered' | 'analyzing' | 'validated' | 'rejected' | 'implementing';
}

export interface Business {
  id: string;
  opportunityId: string;
  name: string;
  description: string;
  website?: string;
  status: 'planning' | 'building' | 'launching' | 'live' | 'failed';
  metrics: BusinessMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessMetrics {
  revenue: number;
  costs: number;
  users: number;
  conversions: number;
  timeToMarket: number;
  lastUpdated: Date;
}

// Strategy system types
export interface ScrapingStrategy {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  sources: SourceConfig[];
  keywords: KeywordStrategy;
  scoring: ScoringStrategy;
  metrics: StrategyMetrics;
  resources: ResourceConfig;
}

export interface SourceConfig {
  url: string;
  weight: number;
  frequency: 'hourly' | 'daily' | 'weekly';
  selectors?: string[];
  tags: string[];
  demographic?: string;
  industry?: string;
  enabled: boolean;
}

export interface KeywordStrategy {
  primary: string[];
  secondary: string[];
  negative: string[];
  contextual: string[];
  weights: Record<string, number>;
}

export interface ScoringStrategy {
  algorithm: 'tfidf' | 'sentiment' | 'payment_evidence' | 'hybrid';
  weights: ScoringWeights;
  thresholds: ScoringThresholds;
  customRules?: ScoringRule[];
}

export interface ScoringWeights {
  trendMomentum?: number;
  competitorCount?: number;
  fundingActivity?: number;
  paymentEvidence?: number;
  problemFrequency?: number;
  competitionGap?: number;
  sentimentScore?: number;
  uniquenessScore?: number;
  implementabilityScore?: number;
}

export interface ScoringThresholds {
  minimumScore: number;
  excellentScore: number;
  lowQualityThreshold: number;
}

export interface ScoringRule {
  condition: string;
  adjustment: number;
  description: string;
}

export interface StrategyMetrics {
  strategyId: string;
  opportunitiesFound: number;
  opportunitiesValidated: number;
  averageOpportunityScore: number;
  falsePositiveRate: number;
  uniqueOpportunityRate: number;
  implementabilityScore: number;
  opportunitiesActioned: number;
  successfulImplementations: number;
  avgTimeToMarket: number;
  avgROI?: number;
  costPerOpportunity: number;
  scrapingTimePerSource: number;
  dataQualityScore: number;
  performanceHistory: PerformanceSnapshot[];
  lastUpdated: Date;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  opportunitiesFound: number;
  qualityScore: number;
  uniquenessScore: number;
  implementabilityScore: number;
  costEfficiency: number;
}

export interface ResourceConfig {
  maxConcurrentScrapes: number;
  timeoutMs: number;
  retryAttempts: number;
  resourceWeight: number;
}

// Queue system types
export interface QueueJob {
  id: string;
  type: string;
  data: any;
  priority: number;
  createdAt: Date;
  scheduledAt?: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Configuration types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetries?: number;
}

export interface LoggerConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  format?: 'json' | 'simple';
  output?: 'console' | 'file' | 'cloudwatch';
}
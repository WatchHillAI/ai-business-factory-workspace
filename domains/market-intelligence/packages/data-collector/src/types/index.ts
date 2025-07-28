// Re-export core types from shared utilities (when available)
// For now, include essential types directly

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
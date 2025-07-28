import axios from 'axios';
import { createLogger } from './logger';
import { ScrapingStrategy, StrategyMetrics } from '../types';

const logger = createLogger('strategy-client');

export class StrategyClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.STRATEGY_MANAGER_URL || 'http://localhost:3005') {
    this.baseUrl = baseUrl;
  }

  async getStrategyForRequest(): Promise<{ strategyId: string; strategy: ScrapingStrategy }> {
    try {
      const response = await axios.get(`${this.baseUrl}/strategies/allocate`, {
        timeout: 5000
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get strategy allocation:', error);
      
      // Fallback to default strategy
      return {
        strategyId: 'startup_ecosystem',
        strategy: this.getDefaultStrategy()
      };
    }
  }

  async getStrategy(strategyId: string): Promise<{ strategyId: string; strategy: ScrapingStrategy }> {
    try {
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}`, {
        timeout: 5000
      });
      
      return {
        strategyId,
        strategy: response.data
      };
    } catch (error) {
      logger.error(`Failed to get strategy ${strategyId}:`, error);
      
      // Fallback to default strategy
      return {
        strategyId: 'startup_ecosystem',
        strategy: this.getDefaultStrategy()
      };
    }
  }

  async recordPerformance(strategyId: string, metrics: Partial<StrategyMetrics>): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/strategies/${strategyId}/performance`, metrics, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      logger.error(`Failed to record performance for strategy ${strategyId}:`, error);
      // Don't throw - performance recording is not critical for scraping
    }
  }

  async getEnabledStrategies(): Promise<ScrapingStrategy[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/strategies/enabled`, {
        timeout: 5000
      });
      
      return response.data.strategies;
    } catch (error) {
      logger.error('Failed to get enabled strategies:', error);
      return [this.getDefaultStrategy()];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 3000
      });
      return response.status === 200;
    } catch (error) {
      logger.warn('Strategy manager health check failed:', error);
      return false;
    }
  }

  private getDefaultStrategy(): ScrapingStrategy {
    return {
      id: 'startup_ecosystem',
      name: 'Startup Ecosystem Monitor (Fallback)',
      description: 'Default fallback strategy when strategy manager is unavailable',
      version: '1.0.0',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      sources: [
        {
          url: 'https://news.ycombinator.com',
          weight: 1.0,
          frequency: 'hourly',
          tags: ['startup', 'tech', 'innovation'],
          enabled: true
        }
      ],
      
      keywords: {
        primary: ['startup', 'funding', 'venture', 'saas', 'ai'],
        secondary: ['entrepreneur', 'technology', 'business'],
        negative: ['established', 'legacy'],
        contextual: ['series_a', 'seed_funding', 'mvp'],
        weights: {
          'startup': 1.0,
          'funding': 1.5
        }
      },
      
      scoring: {
        algorithm: 'tfidf',
        weights: {
          trendMomentum: 0.4,
          competitorCount: 0.3,
          fundingActivity: 0.3
        },
        thresholds: {
          minimumScore: 0.3,
          excellentScore: 0.8,
          lowQualityThreshold: 0.2
        }
      },
      
      metrics: {
        strategyId: 'startup_ecosystem',
        opportunitiesFound: 0,
        opportunitiesValidated: 0,
        averageOpportunityScore: 0,
        falsePositiveRate: 0,
        uniqueOpportunityRate: 0,
        implementabilityScore: 0,
        opportunitiesActioned: 0,
        successfulImplementations: 0,
        avgTimeToMarket: 0,
        costPerOpportunity: 0,
        scrapingTimePerSource: 0,
        dataQualityScore: 0,
        performanceHistory: [],
        lastUpdated: new Date()
      },
      
      resources: {
        maxConcurrentScrapes: 3,
        timeoutMs: 30000,
        retryAttempts: 2,
        resourceWeight: 1.0
      }
    };
  }
}
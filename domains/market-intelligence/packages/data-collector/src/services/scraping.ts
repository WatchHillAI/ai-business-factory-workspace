import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createLogger } from '../utils/logger';
import { DatabaseClient } from '../utils/database';
import { RedisClient } from '../utils/redis';
import { StrategyClient } from '../utils/strategy-client';
import { ScrapingStrategy, MarketData } from '../types';

const logger = createLogger('scraping-service');

export interface ScrapeRequest {
  url: string;
  tags: string[];
  strategyId?: string;
}

export class ScrapingService {
  private browser: Browser | null = null;
  private dbClient: DatabaseClient;
  private redisClient: RedisClient;
  private strategyClient: StrategyClient;

  constructor(dbClient: DatabaseClient, redisClient: RedisClient) {
    this.dbClient = dbClient;
    this.redisClient = redisClient;
    this.strategyClient = new StrategyClient();
  }

  /**
   * Main scraping method - optimized for Lambda execution
   */
  async scrapeUrl(request: ScrapeRequest): Promise<MarketData> {
    const { url, tags, strategyId } = request;
    const startTime = Date.now();

    try {
      // Get strategy for this scraping job
      const strategyData = strategyId 
        ? await this.strategyClient.getStrategy(strategyId)
        : await this.strategyClient.getStrategyForRequest();

      const strategy = strategyData.strategy;
      const currentStrategyId = strategyData.strategyId;

      logger.info('Starting scrape job', { 
        url, 
        tags, 
        strategyId: currentStrategyId,
        strategyName: strategy.name 
      });

      // Initialize browser if needed (reuse for multiple requests)
      if (!this.browser) {
        await this.initializeBrowser();
      }

      // Perform the actual scraping
      const scrapedData = await this.performScrape(url, strategy);

      // Apply strategy-specific scoring
      const relevanceScore = this.calculateRelevanceWithStrategy(
        scrapedData.content, 
        tags, 
        strategy
      );
      const sentiment = this.calculateSentimentWithStrategy(
        scrapedData.content, 
        strategy
      );

      // Create market data object
      const marketData: MarketData = {
        source: this.extractDomain(url),
        url,
        title: scrapedData.title,
        content: scrapedData.content,
        tags: [...tags, ...scrapedData.extractedTags],
        sentiment,
        relevanceScore,
        scrapedAt: new Date(),
        strategyId: currentStrategyId,
      };

      // Save to database
      await this.dbClient.saveMarketData(marketData);

      const processingTime = Date.now() - startTime;

      // Report performance metrics
      await this.strategyClient.recordPerformance(currentStrategyId, {
        opportunitiesFound: 1,
        dataQualityScore: relevanceScore,
        costPerOpportunity: processingTime / 1000,
        scrapingTimePerSource: processingTime,
        lastUpdated: new Date()
      });

      logger.info('Scrape job completed successfully', {
        url,
        title: marketData.title,
        contentLength: marketData.content.length,
        relevanceScore,
        sentiment,
        processingTime,
        strategyId: currentStrategyId
      });

      return marketData;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Scrape job failed', { 
        url, 
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime 
      });

      // Report failure metrics
      if (strategyId) {
        await this.strategyClient.recordPerformance(strategyId, {
          costPerOpportunity: processingTime / 1000,
          scrapingTimePerSource: processingTime,
          lastUpdated: new Date()
        });
      }

      throw error;
    }
  }

  /**
   * Schedule scraping jobs for all enabled strategies
   */
  async scheduleScrapingJobs(): Promise<void> {
    try {
      const strategies = await this.strategyClient.getEnabledStrategies();
      
      logger.info('Scheduling scraping jobs', { strategiesCount: strategies.length });

      for (const strategy of strategies) {
        for (const source of strategy.sources) {
          if (!source.enabled) continue;

          // Queue scraping job
          await this.redisClient.queueJob({
            type: 'scrape',
            data: {
              url: source.url,
              tags: source.tags,
              strategyId: strategy.id
            }
          });
        }
      }

      logger.info('All scraping jobs scheduled successfully');
    } catch (error) {
      logger.error('Failed to schedule scraping jobs', { error });
      throw error;
    }
  }

  /**
   * Initialize Puppeteer browser with Lambda-optimized settings
   */
  private async initializeBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true, // Use headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // Important for Lambda
        ],
        timeout: 30000,
      });

      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser', { error });
      throw error;
    }
  }

  /**
   * Perform the actual web scraping
   */
  private async performScrape(url: string, strategy?: ScrapingStrategy) {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set realistic headers and viewport
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      );
      
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Extract content using strategy-specific selectors or fallback
      const content = await page.content();
      const $ = cheerio.load(content);

      // Remove noise elements
      $('script, style, nav, footer, aside, .advertisement').remove();

      const title = $('title').text() || $('h1').first().text() || '';
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      
      const extractedTags = this.extractTags(bodyText, strategy);

      return {
        title: title.trim(),
        content: bodyText,
        extractedTags
      };

    } finally {
      await page.close();
    }
  }

  /**
   * Extract tags using strategy-specific keywords
   */
  private extractTags(content: string, strategy?: ScrapingStrategy): string[] {
    const keywords = strategy?.keywords ? [
      ...strategy.keywords.primary,
      ...strategy.keywords.secondary,
      ...strategy.keywords.contextual
    ] : [
      'startup', 'business', 'market', 'revenue', 'profit', 'investment',
      'funding', 'venture', 'entrepreneur', 'innovation', 'technology'
    ];

    const tags: string[] = [];
    const lowerContent = content.toLowerCase();

    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)];
  }

  /**
   * Calculate relevance score using strategy-specific weights
   */
  private calculateRelevanceWithStrategy(
    content: string, 
    tags: string[], 
    strategy: ScrapingStrategy
  ): number {
    if (tags.length === 0) return 0.5;

    const lowerContent = content.toLowerCase();
    let totalScore = 0;
    let totalWeight = 0;

    tags.forEach(tag => {
      if (lowerContent.includes(tag.toLowerCase())) {
        const weight = strategy.keywords?.weights?.[tag] || 1.0;
        totalScore += weight;
        totalWeight += weight;
      }
    });

    // Apply negative keyword penalty
    if (strategy.keywords?.negative) {
      strategy.keywords.negative.forEach(negativeKeyword => {
        if (lowerContent.includes(negativeKeyword.toLowerCase())) {
          totalScore *= 0.7;
        }
      });
    }

    return totalWeight > 0 ? Math.min(1, totalScore / totalWeight) : 0;
  }

  /**
   * Calculate sentiment with strategy awareness
   */
  private calculateSentimentWithStrategy(content: string, strategy: ScrapingStrategy): number {
    // Basic sentiment calculation - can be enhanced with strategy-specific sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'opportunity'];
    const negativeWords = ['bad', 'terrible', 'problem', 'issue', 'failure'];

    const words = content.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    return Math.max(-1, Math.min(1, score / words.length * 100));
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Cleanup browser when Lambda container is shutting down
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser cleanup completed');
    }
  }
}
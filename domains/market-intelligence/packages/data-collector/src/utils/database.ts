import { Pool, PoolClient } from 'pg';
import { createLogger } from './logger';
import { MarketData } from '../types';

const logger = createLogger('database-client');

export class DatabaseClient {
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/ai_business_factory';
    
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection on startup
    this.testConnection();
  }

  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to database', { error });
    }
  }

  async saveMarketData(data: MarketData): Promise<MarketData> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO market_data (
          source, url, title, content, tags, sentiment, 
          relevance_score, scraped_at, strategy_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, *
      `;
      
      const values = [
        data.source,
        data.url,
        data.title,
        data.content,
        JSON.stringify(data.tags),
        data.sentiment,
        data.relevanceScore,
        data.scrapedAt,
        data.strategyId
      ];

      const result = await client.query(query, values);
      const savedData = result.rows[0];
      
      logger.info('Market data saved successfully', { 
        id: savedData.id, 
        source: savedData.source,
        title: savedData.title?.substring(0, 50) + '...'
      });

      return {
        id: savedData.id,
        source: savedData.source,
        url: savedData.url,
        title: savedData.title,
        content: savedData.content,
        tags: JSON.parse(savedData.tags),
        sentiment: savedData.sentiment,
        relevanceScore: savedData.relevance_score,
        scrapedAt: savedData.scraped_at,
        strategyId: savedData.strategy_id
      };

    } catch (error) {
      logger.error('Failed to save market data', { error, url: data.url });
      throw error;
    } finally {
      client.release();
    }
  }

  async getMarketData(limit: number = 10): Promise<MarketData[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM market_data 
        ORDER BY scraped_at DESC 
        LIMIT $1
      `;
      
      const result = await client.query(query, [limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        source: row.source,
        url: row.url,
        title: row.title,
        content: row.content,
        tags: JSON.parse(row.tags),
        sentiment: row.sentiment,
        relevanceScore: row.relevance_score,
        scrapedAt: row.scraped_at,
        strategyId: row.strategy_id
      }));

    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }
}
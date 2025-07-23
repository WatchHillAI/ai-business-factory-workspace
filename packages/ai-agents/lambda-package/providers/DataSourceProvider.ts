import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { DataSourceConfig } from '../types/agent';

export interface DataSourceResponse<T = any> {
  data: T;
  metadata: {
    source: string;
    timestamp: string;
    cached: boolean;
    rateLimit?: {
      remaining: number;
      resetTime: string;
    };
  };
}

export abstract class DataSourceProvider {
  protected config: DataSourceConfig;
  protected httpClient: AxiosInstance;

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout || 10000,
      headers: {
        'User-Agent': 'AI-Business-Factory-Agent/1.0',
        'Accept': 'application/json',
      },
    });

    // Add authentication if credentials provided
    if (config.credentials) {
      this.setupAuthentication(config.credentials);
    }
  }

  protected setupAuthentication(credentials: Record<string, string>): void {
    if (credentials.apiKey) {
      // API Key authentication (header)
      if (credentials.apiKeyHeader) {
        this.httpClient.defaults.headers.common[credentials.apiKeyHeader] = credentials.apiKey;
      } else {
        this.httpClient.defaults.headers.common['X-API-Key'] = credentials.apiKey;
      }
    }

    if (credentials.bearerToken) {
      // Bearer token authentication
      this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${credentials.bearerToken}`;
    }

    if (credentials.username && credentials.password) {
      // Basic authentication
      const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      this.httpClient.defaults.headers.common['Authorization'] = `Basic ${auth}`;
    }
  }

  abstract fetchData(query: any): Promise<DataSourceResponse>;
  abstract testConnection(): Promise<boolean>;
  abstract getRateLimit(): Promise<{ remaining: number; resetTime: string } | null>;
}

export class GoogleTrendsProvider extends DataSourceProvider {
  constructor(config: Omit<DataSourceConfig, 'type'>) {
    super({
      ...config,
      type: 'api',
      endpoint: config.endpoint || 'https://trends.googleapis.com/trends/api'
    });
  }

  async fetchData(query: {
    keywords: string[];
    timeRange?: string;
    geo?: string;
  }): Promise<DataSourceResponse> {
    try {
      // Note: This is a simplified implementation
      // Real Google Trends API requires more complex authentication
      const response = await this.httpClient.get('/explore', {
        params: {
          q: query.keywords.join(','),
          date: query.timeRange || 'today 12-m',
          geo: query.geo || 'US'
        }
      });

      return {
        data: response.data,
        metadata: {
          source: 'google_trends',
          timestamp: new Date().toISOString(),
          cached: false
        }
      };
    } catch (error) {
      throw new Error(`Google Trends API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.httpClient.get('/trending');
      return true;
    } catch {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: string } | null> {
    // Google Trends doesn't typically expose rate limit info
    return null;
  }
}

export class CrunchbaseProvider extends DataSourceProvider {
  constructor(config: Omit<DataSourceConfig, 'type'>) {
    super({
      ...config,
      type: 'api',
      endpoint: config.endpoint || 'https://api.crunchbase.com/v4'
    });
  }

  async fetchData(query: {
    organizationName?: string;
    category?: string;
    fundingRounds?: boolean;
    acquisitions?: boolean;
  }): Promise<DataSourceResponse> {
    try {
      const params: any = {};
      
      if (query.organizationName) {
        params.name = query.organizationName;
      }
      
      if (query.category) {
        params.category_groups = query.category;
      }

      const response = await this.httpClient.get('/searches/organizations', {
        params
      });

      return {
        data: response.data,
        metadata: {
          source: 'crunchbase',
          timestamp: new Date().toISOString(),
          cached: false,
          rateLimit: this.extractRateLimit(response.headers)
        }
      };
    } catch (error) {
      throw new Error(`Crunchbase API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.httpClient.get('/entities/organizations/facebook');
      return true;
    } catch {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: string } | null> {
    try {
      const response = await this.httpClient.get('/');
      return this.extractRateLimit(response.headers);
    } catch {
      return null;
    }
  }

  private extractRateLimit(headers: any): { remaining: number; resetTime: string } | undefined {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    
    if (remaining && reset) {
      return {
        remaining: parseInt(remaining),
        resetTime: new Date(parseInt(reset) * 1000).toISOString()
      };
    }
    
    return undefined;
  }
}

export class SEMrushProvider extends DataSourceProvider {
  constructor(config: Omit<DataSourceConfig, 'type'>) {
    super({
      ...config,
      type: 'api',
      endpoint: config.endpoint || 'https://api.semrush.com'
    });
  }

  async fetchData(query: {
    keywords: string[];
    database?: string;
    reportType?: 'keyword_overview' | 'phrase_fullsearch' | 'phrase_kdi';
  }): Promise<DataSourceResponse> {
    try {
      const params = {
        type: query.reportType || 'keyword_overview',
        key: this.config.credentials?.apiKey,
        phrase: query.keywords.join(','),
        database: query.database || 'us',
        export_columns: 'Ph,Nq,Cp,Co,Nr,Td'
      };

      const response = await this.httpClient.get('/', { params });

      return {
        data: response.data,
        metadata: {
          source: 'semrush',
          timestamp: new Date().toISOString(),
          cached: false
        }
      };
    } catch (error) {
      throw new Error(`SEMrush API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const params = {
        type: 'domain_overview',
        key: this.config.credentials?.apiKey,
        domain: 'example.com',
        database: 'us'
      };
      
      await this.httpClient.get('/', { params });
      return true;
    } catch {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: string } | null> {
    // SEMrush doesn't typically expose rate limit info in headers
    return null;
  }
}

export class MockDataSourceProvider extends DataSourceProvider {
  private mockData: Map<string, any> = new Map();

  constructor(name: string = 'mock-source') {
    super({
      name,
      type: 'static',
      enabled: true,
      timeout: 1000
    });
    
    this.setupMockData();
  }

  private setupMockData(): void {
    // Market research mock data
    this.mockData.set('market_trends', {
      trends: [
        {
          keyword: 'ai customer service',
          searchVolume: 45000,
          growthRate: 287,
          timeframe: '24 months'
        },
        {
          keyword: 'chatbot for small business',
          searchVolume: 12000,
          growthRate: 156,
          timeframe: '24 months'
        }
      ]
    });

    // Company/competitor mock data  
    this.mockData.set('companies', {
      companies: [
        {
          name: 'Intercom',
          category: 'customer_service_software',
          fundingTotal: '$238M',
          employees: '800-1000',
          marketPosition: 'leader'
        },
        {
          name: 'Zendesk',
          category: 'customer_service_software', 
          fundingTotal: 'Public',
          employees: '5000+',
          marketPosition: 'leader'
        }
      ]
    });

    // Industry reports mock data
    this.mockData.set('industry_reports', {
      marketSize: {
        global: 150000000000,
        segment: 45000000000,
        growthRate: 0.12
      },
      trends: [
        'AI adoption in customer service',
        'SMB digital transformation',
        'Remote work support tools'
      ]
    });
  }

  async fetchData(query: { type: string; params?: any }): Promise<DataSourceResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));

    const data = this.mockData.get(query.type) || { message: 'Mock data not found' };

    return {
      data,
      metadata: {
        source: this.config.name,
        timestamp: new Date().toISOString(),
        cached: false
      }
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: string } | null> {
    return {
      remaining: 1000,
      resetTime: new Date(Date.now() + 3600000).toISOString()
    };
  }
}

// Factory function to create appropriate data source provider
export function createDataSourceProvider(
  type: 'google_trends' | 'crunchbase' | 'semrush' | 'mock',
  config: Omit<DataSourceConfig, 'type'>
): DataSourceProvider {
  switch (type) {
    case 'google_trends':
      return new GoogleTrendsProvider(config);
    
    case 'crunchbase':
      return new CrunchbaseProvider(config);
    
    case 'semrush':
      return new SEMrushProvider(config);
    
    case 'mock':
      return new MockDataSourceProvider(config.name);
    
    default:
      throw new Error(`Unknown data source provider type: ${type}`);
  }
}
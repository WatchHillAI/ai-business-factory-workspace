import { createClient, RedisClientType } from 'redis';

export abstract class CacheProvider {
  abstract get(key: string): Promise<string | null>;
  abstract set(key: string, value: string, ttl?: number): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract clear(): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
}

export class RedisCacheProvider extends CacheProvider {
  private client: RedisClientType;
  private keyPrefix: string;

  constructor(config: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    keyPrefix?: string;
  } = {}) {
    super();
    
    this.keyPrefix = config.keyPrefix || 'ai-agent:';
    
    if (config.url) {
      this.client = createClient({ url: config.url });
    } else {
      this.client = createClient({
        socket: {
          host: config.host || 'localhost',
          port: config.port || 6379,
        },
        password: config.password,
      });
    }

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  async connect(): Promise<void> {
    if (!this.client.isReady) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isReady) {
      await this.client.quit();
    }
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    await this.connect();
    return await this.client.get(this.getKey(key));
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.connect();
    const redisKey = this.getKey(key);
    
    if (ttl) {
      await this.client.setEx(redisKey, ttl, value);
    } else {
      await this.client.set(redisKey, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.connect();
    await this.client.del(this.getKey(key));
  }

  async clear(): Promise<void> {
    await this.connect();
    const keys = await this.client.keys(`${this.keyPrefix}*`);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    await this.connect();
    const result = await this.client.exists(this.getKey(key));
    return result === 1;
  }
}

export class MemoryCacheProvider extends CacheProvider {
  private cache = new Map<string, { value: string; expiry?: number }>();
  private keyPrefix: string;

  constructor(keyPrefix: string = 'ai-agent:') {
    super();
    this.keyPrefix = keyPrefix;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(this.getKey(key));
    
    if (!entry) {
      return null;
    }
    
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(this.getKey(key));
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const entry = {
      value,
      expiry: ttl ? Date.now() + (ttl * 1000) : undefined
    };
    
    this.cache.set(this.getKey(key), entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(this.getKey(key));
  }

  async clear(): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.startsWith(this.keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(this.getKey(key));
    
    if (!entry) {
      return false;
    }
    
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(this.getKey(key));
      return false;
    }
    
    return true;
  }

  // Additional method for memory cache to get stats
  getStats(): { size: number; activeEntries: number } {
    this.cleanup(); // Clean before getting stats
    const totalEntries = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(this.keyPrefix)
    ).length;
    
    return {
      size: this.cache.size,
      activeEntries: totalEntries
    };
  }
}

export class NullCacheProvider extends CacheProvider {
  async get(key: string): Promise<string | null> {
    return null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    // No-op
  }

  async delete(key: string): Promise<void> {
    // No-op
  }

  async clear(): Promise<void> {
    // No-op
  }

  async exists(key: string): Promise<boolean> {
    return false;
  }
}

// Factory function to create appropriate cache provider
export function createCacheProvider(
  type: 'redis' | 'memory' | 'none',
  config: any = {}
): CacheProvider {
  switch (type) {
    case 'redis':
      return new RedisCacheProvider(config);
    
    case 'memory':
      return new MemoryCacheProvider(config.keyPrefix);
    
    case 'none':
      return new NullCacheProvider();
    
    default:
      throw new Error(`Unknown cache provider type: ${type}`);
  }
}
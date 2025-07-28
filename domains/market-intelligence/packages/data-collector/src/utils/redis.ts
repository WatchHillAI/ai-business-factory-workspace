import { createClient, RedisClientType } from 'redis';
import { createLogger } from './logger';

const logger = createLogger('redis-client');

export interface QueueJob {
  id: string;
  type: string;
  data: any;
  priority?: number;
  createdAt: Date;
}

export class RedisClient {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis connection failed after 10 retries');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error });
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });

    // Connect on initialization
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
    }
  }

  async queueJob(job: Omit<QueueJob, 'id' | 'createdAt'>): Promise<void> {
    try {
      await this.connect();
      
      const fullJob: QueueJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        priority: 1,
        ...job
      };

      const queueName = `queue:${job.type}`;
      await this.client.lPush(queueName, JSON.stringify(fullJob));
      
      logger.info('Job queued successfully', { 
        jobId: fullJob.id, 
        type: job.type,
        queueName 
      });

    } catch (error) {
      logger.error('Failed to queue job', { error, jobType: job.type });
      throw error;
    }
  }

  async dequeueJob(jobType: string): Promise<QueueJob | null> {
    try {
      await this.connect();
      
      const queueName = `queue:${jobType}`;
      const jobData = await this.client.rPop(queueName);
      
      if (!jobData) {
        return null;
      }

      const job = JSON.parse(jobData) as QueueJob;
      logger.info('Job dequeued successfully', { 
        jobId: job.id, 
        type: job.type 
      });
      
      return job;

    } catch (error) {
      logger.error('Failed to dequeue job', { error, jobType });
      throw error;
    }
  }

  async getQueueLength(jobType: string): Promise<number> {
    try {
      await this.connect();
      const queueName = `queue:${jobType}`;
      return await this.client.lLen(queueName);
    } catch (error) {
      logger.error('Failed to get queue length', { error, jobType });
      return 0;
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed', { error });
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      logger.info('Redis client disconnected');
    }
  }
}
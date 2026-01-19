import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Redis Caching Service
 *
 * Features:
 * - Generic caching with TTL
 * - Query result caching
 * - Cache invalidation patterns
 * - Automatic JSON serialization
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get('REDIS_ENABLED', 'false') === 'true';

    if (this.enabled) {
      this.redis = new Redis({
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD') || undefined,
        db: this.configService.get('REDIS_CACHE_DB', 1), // Use separate DB for cache
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis cache connected');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis cache error', error);
      });
    } else {
      this.logger.warn('Redis caching is disabled');
    }
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.enabled) return;

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      this.logger.debug(`Cached key: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}`, error);
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.redis.del(key);
      this.logger.debug(`Deleted cache key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}`, error);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Deleted ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Cache pattern delete error for ${pattern}`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists check error for key ${key}`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - get from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    // Cache miss - execute factory
    this.logger.debug(`Cache miss: ${key}`);
    const value = await factory();

    // Cache the result
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Increment counter
   */
  async increment(key: string, ttl?: number): Promise<number> {
    if (!this.enabled) return 0;

    try {
      const value = await this.redis.incr(key);
      if (ttl && value === 1) {
        // Set TTL only on first increment
        await this.redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache increment error for key ${key}`, error);
      return 0;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.redis.flushdb();
      this.logger.warn('Cache cleared');
    } catch (error) {
      this.logger.error('Cache clear error', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    if (!this.enabled) {
      return { enabled: false };
    }

    try {
      const info = await this.redis.info('stats');
      const dbsize = await this.redis.dbsize();

      return {
        enabled: true,
        keys: dbsize,
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats', error);
      return { enabled: true, error: error.message };
    }
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n');
    const stats: Record<string, string> = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    }

    return stats;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis cache disconnected');
    }
  }
}

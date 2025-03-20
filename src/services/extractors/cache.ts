// src/services/extractors/cache.ts
import { createCache } from 'cache-manager';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';
import { env } from '@/config/env.js';
import { logger } from '@/utils/logger.js';
import { err, ok, type Result } from 'neverthrow';

export class InternalCache {
  private cache: ReturnType<typeof createCache>;

  constructor(options: { ttl?: number } = {}) {
    const ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 hours default TTL
    this.cache = createCache({
      ttl,
      stores: [
        new Keyv({
          store: new KeyvRedis({
            url: env.REDIS_URL
          })
        })
      ]
    });
  }

  /**
   * Get a value from the cache by key
   */
  async get<T>(key: string): Promise<Result<T | null, Error>> {
    try {
      const value = await this.cache.get<T>(key);
      return ok(value || null);
    } catch (error) {
      logger.error('Cache error:', error);
      return err(error as Error);
    }
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<Result<T, Error>> {
    try {
      await this.cache.set(key, value, ttl);
      return ok(value);
    } catch (error) {
      return err(error as Error);
    }
  }

  /**
   * Delete a value from the cache
   */
  async del(key: string): Promise<Result<string, Error>> {
    try {
      await this.cache.del(key);
      return ok(key);
    } catch (error) {
      logger.error('Cache error:', error);
      return err(error as Error);
    }
  }

  /**
   * Clear the entire cache
   */
  async clear(): Promise<Result<void, Error>> {
    try {
      await this.cache.clear();
      return ok(undefined);
    } catch (error) {
      logger.error('Cache error:', error);
      return err(error as Error);
    }
  }

  /**
   * Disconnect from the cache (important for clean shutdown)
   */
  async disconnect(): Promise<Result<void, Error>> {
    try {
      await this.cache.disconnect();
      return ok(undefined);
    } catch (error) {
      logger.error('Cache error:', error);
      return err(error as Error);
    }
  }

  /**
   * Get cache statistics (simplified)
   */
  getCacheStats(): { hits: number; misses: number; total?: number } {
    return {
      hits: 0,
      misses: 0,
      total: 0
    };
  }
}

export const internalCache = new InternalCache();
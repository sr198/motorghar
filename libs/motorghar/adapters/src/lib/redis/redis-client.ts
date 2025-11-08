/**
 * Redis Client Singleton
 * Ensures we have a single Redis client instance across the application
 */

import { Redis } from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis | undefined };

export const redis: Redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

/**
 * Connect to Redis (lazy connection)
 */
export async function connectRedis() {
  if (redis.status === 'ready') {
    return redis;
  }
  await redis.connect();
  return redis;
}

/**
 * Gracefully disconnect Redis on process termination
 */
export async function disconnectRedis() {
  await redis.quit();
}

process.on('SIGINT', async () => {
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
  process.exit(0);
});
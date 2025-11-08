import { FastifyInstance } from 'fastify';
import { prisma, redis, connectRedis } from '@motorghar/adapters';

export default async function (fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    // Check database connection
    let dbHealth = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbHealth = 'connected';
    } catch (error) {
      fastify.log.error(error, 'Database health check failed');
    }

    // Check Redis connection
    let redisHealth = 'disconnected';
    try {
      await connectRedis();
      const pong = await redis.ping();
      redisHealth = pong === 'PONG' ? 'connected' : 'disconnected';
    } catch (error) {
      fastify.log.error(error, 'Redis health check failed');
    }

    return {
      status: 'ok',
      service: 'fastify-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      redis: redisHealth,
    };
  });
}
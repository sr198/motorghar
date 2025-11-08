import { FastifyInstance } from 'fastify';
import { prisma } from '@motorghar/adapters';

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

    return {
      status: 'ok',
      service: 'svc-content',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
    };
  });
}
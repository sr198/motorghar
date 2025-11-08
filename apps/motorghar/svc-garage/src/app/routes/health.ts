import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'svc-garage',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
}

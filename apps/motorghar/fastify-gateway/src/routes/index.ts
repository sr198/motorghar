import { FastifyPluginAsync } from 'fastify';
import { authRoutes } from './auth.js';
import { proxyRoutes } from './proxy.js';

export const registerRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check
  fastify.get('/health', async () => ({ status: 'ok', service: 'gateway' }));

  // Auth routes
  await fastify.register(authRoutes);

  // Service proxies
  await fastify.register(proxyRoutes);
};
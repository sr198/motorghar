import { FastifyPluginAsync } from 'fastify';
import proxy from '@fastify/http-proxy';
import { config } from '../config/index.js';

export const proxyRoutes: FastifyPluginAsync = async (fastify) => {
  // Catalog service proxy
  await fastify.register(proxy, {
    upstream: config.services.catalog,
    prefix: '/v1/catalog',
    rewritePrefix: '',
    http2: false,
  });

  // Content service proxy
  await fastify.register(proxy, {
    upstream: config.services.content,
    prefix: '/v1/content',
    rewritePrefix: '',
    http2: false,
  });

  // Service center proxy
  await fastify.register(proxy, {
    upstream: config.services.serviceCenter,
    prefix: '/v1/centers',
    rewritePrefix: '',
    http2: false,
  });

  // Garage service proxy (reviews only in R1)
  await fastify.register(proxy, {
    upstream: config.services.garage,
    prefix: '/v1/reviews',
    rewritePrefix: '/reviews',
    http2: false,
  });
};
import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}

export const requestLoggerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request) => {
    const requestId = randomUUID();
    request.headers['x-request-id'] = requestId;
    request.startTime = Date.now();

    fastify.log.info({
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
    }, 'Incoming request');
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = request.startTime ? Date.now() - request.startTime : 0;

    fastify.log.info({
      requestId: request.headers['x-request-id'],
      statusCode: reply.statusCode,
      responseTime,
    }, 'Request completed');
  });
};
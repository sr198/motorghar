import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: 'admin' | 'user';
    };
  }
}

const authPluginImpl: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for login endpoint and health check
    if (request.url === '/v1/auth/login' || request.url === '/health') {
      return;
    }

    const token = extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      return reply.status(401).send({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication token required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.headers['x-request-id'] as string,
        },
      });
    }

    try {
      const payload = verifyToken(token);
      request.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return reply.status(401).send({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.headers['x-request-id'] as string,
        },
      });
    }
  });
};

// Export as non-encapsulated plugin so it applies to all routes
export const authPlugin = fp(authPluginImpl);
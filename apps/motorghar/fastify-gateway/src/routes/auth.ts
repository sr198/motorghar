import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { LoginRequestSchema } from '@motorghar/contracts';
import { signToken } from '../utils/jwt.js';
import { formatSuccess, formatError } from '../utils/response-formatter.js';
import { config } from '../config/index.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/v1/auth/login', async (request, reply) => {
    const requestId = request.headers['x-request-id'] as string;

    const body = LoginRequestSchema.parse(request.body);

    // R1 stub: hardcoded admin credentials
    if (body.email !== config.admin.email || body.password !== config.admin.password) {
      return reply.status(401).send(
        formatError('INVALID_CREDENTIALS', 'Invalid email or password', undefined, requestId)
      );
    }

    const userId = randomUUID(); // In R1, we use a random UUID for simplicity
    const token = signToken({
      userId,
      email: body.email,
      role: 'admin',
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return reply.status(200).send(
      formatSuccess(
        {
          token,
          expiresAt: expiresAt.toISOString(),
          user: {
            id: userId,
            email: body.email,
            role: 'admin' as const,
          },
        },
        requestId
      )
    );
  });

  fastify.get('/v1/auth/me', async (request, reply) => {
    const requestId = request.headers['x-request-id'] as string;

    if (!request.user) {
      console.log('Request does not have user info' + JSON.stringify(request.headers));
      return reply.status(401).send(
        formatError('AUTH_REQUIRED', 'User not authenticated', undefined, requestId)
      );
    }

    return reply.status(200).send(
      formatSuccess(
        {
          id: request.user.userId,
          email: request.user.email,
          role: request.user.role,
        },
        requestId
      )
    );
  });
};
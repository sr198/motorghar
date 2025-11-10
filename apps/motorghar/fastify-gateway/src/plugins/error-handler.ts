import { FastifyPluginAsync } from 'fastify';
import { formatError } from '../utils/response-formatter.js';

export const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    const requestId = request.headers['x-request-id'] as string;

    // Zod validation errors
    if (error.name === 'ZodError' && 'issues' in error) {
      const issues = (error as any).issues;
      const details = Array.isArray(issues) ? issues.map((issue: any) => ({
        field: issue.path?.join('.') || '',
        message: issue.message || 'Validation error',
        code: issue.code || 'invalid',
      })) : [];

      return reply.status(400).send(
        formatError('VALIDATION_ERROR', 'Request validation failed', details, requestId)
      );
    }

    // JWT errors
    if (error.message.includes('token')) {
      return reply.status(401).send(
        formatError('AUTH_ERROR', error.message, undefined, requestId)
      );
    }

    // Service unavailable
    if (error.message.includes('ECONNREFUSED')) {
      return reply.status(503).send(
        formatError('SERVICE_UNAVAILABLE', 'Backend service is unavailable', undefined, requestId)
      );
    }

    // Default error
    fastify.log.error({ error, requestId }, 'Unhandled error');
    return reply.status(error.statusCode || 500).send(
      formatError(
        'INTERNAL_ERROR',
        error.message || 'An unexpected error occurred',
        undefined,
        requestId
      )
    );
  });
};
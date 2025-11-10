import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { corsPlugin } from './cors.js';
import { requestLoggerPlugin } from './request-logger.js';
import { errorHandlerPlugin } from './error-handler.js';
import { authPlugin } from './auth.js';

const registerPluginsImpl: FastifyPluginAsync = async (fastify) => {
  // Order matters!
  await fastify.register(corsPlugin);
  await fastify.register(requestLoggerPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(authPlugin);
};

// Break encapsulation so plugins are available to all routes
export const registerPlugins = fp(registerPluginsImpl);
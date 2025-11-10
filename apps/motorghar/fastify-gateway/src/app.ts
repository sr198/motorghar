import Fastify from 'fastify';
import { config } from './config/index.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: config.logging.level,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register plugins
  console.log('🔌 Registering plugins...');
  await fastify.register(registerPlugins);

  // Register routes
  console.log('🚪 Registering routes...');
  await fastify.register(registerRoutes);

  return fastify;
}
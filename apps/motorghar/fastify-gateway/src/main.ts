import 'dotenv/config';
import { buildApp } from './app.js';
import { config } from './config/index.js';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`🚀 Gateway running on http://localhost:${config.port}`);
    console.log(`📋 Environment: ${config.env}`);
  } catch (error) {
    console.error('❌ Failed to start gateway:', error);
    process.exit(1);
  }
}

start();

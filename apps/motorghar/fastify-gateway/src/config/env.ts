import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string(),//z.enum(['development', 'production', 'test']).default('development'),
  PORT_GATEWAY: z.coerce.number().default(3000),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('24h'),

  // Admin credentials (R1 stub)
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(6),

  // Service URLs
  PORT_SVC_CATALOG: z.coerce.number().default(3001),
  PORT_SVC_CONTENT: z.coerce.number().default(3002),
  PORT_SVC_SERVICE_CENTER: z.coerce.number().default(3003),
  PORT_SVC_GARAGE: z.coerce.number().default(3004),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables', { cause: parsed.error });
  }

  return parsed.data;
}

export const env = loadEnv();
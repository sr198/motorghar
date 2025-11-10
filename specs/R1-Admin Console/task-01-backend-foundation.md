# Task 01: Backend Foundation - Gateway, Auth Stub & Shared Libraries

**Parent Spec:** `spec.md` (R1 - Admin Console)
**Status:** ✅ Completed
**Estimated Effort:** 2-3 days
**Dependencies:** R0 Foundation complete

---

## References to Main Spec

- **Architecture:** Section 2 - High-Level Architecture
- **Auth Strategy:** Section 6 - Authentication & Authorization
- **Shared Packages:** Section 5 - Shared Packages
- **Environment Config:** Section 11 - Environment Configuration
- **Port Allocation:** Main PRD Section 20

---

## Objective

Establish the foundational backend infrastructure including:
1. Shared libraries (`contracts`, `types`, `domain`, `adapters`)
2. Fastify API Gateway with routing, auth, and middleware
3. JWT-based authentication stub
4. Common error handling and response formatting
5. Logging and telemetry foundation

---

## Step-by-Step Implementation

### Phase 1: Shared Libraries Setup

#### 1.1 Create `libs/shared/contracts` Package

**Command:**
```bash
npx nx g @nx/node:library contracts --directory=shared --importPath=@motorghar/contracts --buildable
```

**File Structure:**
```
libs/shared/contracts/
├── src/
│   ├── index.ts
│   ├── common/
│   │   ├── index.ts
│   │   ├── responses.ts      # Common response schemas
│   │   └── pagination.ts     # Pagination schemas
│   ├── catalog/
│   │   ├── index.ts
│   │   ├── vehicle-catalog.ts
│   │   └── vehicle-variant.ts
│   ├── service-center/
│   │   ├── index.ts
│   │   └── service-center.ts
│   ├── content/
│   │   ├── index.ts
│   │   └── content-post.ts
│   ├── garage/
│   │   ├── index.ts
│   │   └── owner-vehicle-review.ts
│   └── auth/
│       ├── index.ts
│       └── auth.ts
├── package.json
└── tsconfig.json
```

**File: `libs/shared/contracts/src/common/responses.ts`**
```typescript
import { z } from 'zod';

export const MetaSchema = z.object({
  timestamp: z.string().datetime(),
  requestId: z.string().uuid(),
});

export const PaginationMetaSchema = MetaSchema.extend({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: MetaSchema,
  });

export const ListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

export const ErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ErrorDetailSchema).optional(),
  }),
  meta: MetaSchema,
});

export type SuccessResponse<T> = {
  data: T;
  meta: z.infer<typeof MetaSchema>;
};

export type ListResponse<T> = {
  data: T[];
  meta: z.infer<typeof PaginationMetaSchema>;
};

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```

**File: `libs/shared/contracts/src/common/pagination.ts`**
```typescript
import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
```

**File: `libs/shared/contracts/src/auth/auth.ts`**
```typescript
import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['admin', 'user']),
  }),
});

export const JwtPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  iat: z.number(),
  exp: z.number(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
```

**File: `libs/shared/contracts/src/index.ts`**
```typescript
export * from './common/responses';
export * from './common/pagination';
export * from './auth/auth';
// Will add catalog, service-center, content, garage exports as they're built
```

**Update `libs/shared/contracts/package.json` - Add dependencies:**
```json
{
  "dependencies": {
    "zod": "^3.22.4"
  }
}
```

**Validation Command:**
```bash
npx nx build contracts
npx nx lint contracts
```

---

#### 1.2 Create `libs/shared/types` Package

**Command:**
```bash
npx nx g @nx/node:library types --directory=shared --importPath=@motorghar/types --buildable
```

**File Structure:**
```
libs/shared/types/
├── src/
│   ├── index.ts
│   ├── ids.ts
│   ├── enums.ts
│   └── utils.ts
├── package.json
└── tsconfig.json
```

**File: `libs/shared/types/src/ids.ts`**
```typescript
// Branded types for type-safe IDs
export type Brand<K, T> = K & { __brand: T };

export type CatalogId = Brand<string, 'CatalogId'>;
export type VariantId = Brand<string, 'VariantId'>;
export type CenterId = Brand<string, 'CenterId'>;
export type ContentId = Brand<string, 'ContentId'>;
export type ReviewId = Brand<string, 'ReviewId'>;
export type UserId = Brand<string, 'UserId'>;
export type OwnerVehicleId = Brand<string, 'OwnerVehicleId'>;

export function catalogId(id: string): CatalogId {
  return id as CatalogId;
}

export function variantId(id: string): VariantId {
  return id as VariantId;
}

export function centerId(id: string): CenterId {
  return id as CenterId;
}

export function contentId(id: string): ContentId {
  return id as ContentId;
}

export function reviewId(id: string): ReviewId {
  return id as ReviewId;
}

export function userId(id: string): UserId {
  return id as UserId;
}

export function ownerVehicleId(id: string): OwnerVehicleId {
  return id as OwnerVehicleId;
}
```

**File: `libs/shared/types/src/enums.ts`**
```typescript
export enum ContentPostType {
  NEWS = 'news',
  EVENT = 'event',
  VIDEO = 'video',
  RECALL = 'recall',
}

export enum ContentPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum EntityType {
  VEHICLE_CATALOG = 'vehicle.catalog#v1',
  VEHICLE_VARIANT = 'vehicle.variant#v1',
  SERVICE_CENTER = 'service.center#v1',
  CONTENT_POST = 'content.post#v1',
  OWNER_VEHICLE_REVIEW = 'owner.vehicle.review#v1',
}
```

**File: `libs/shared/types/src/index.ts`**
```typescript
export * from './ids';
export * from './enums';
export * from './utils';
```

**Validation Command:**
```bash
npx nx build types
npx nx lint types
```

---

#### 1.3 Create `libs/motorghar/domain` Package

**Command:**
```bash
npx nx g @nx/node:library domain --directory=motorghar --importPath=@motorghar/domain --buildable
```

**File Structure:**
```
libs/motorghar/domain/
├── src/
│   ├── index.ts
│   ├── base/
│   │   ├── index.ts
│   │   ├── entity.ts
│   │   └── value-object.ts
│   ├── events/
│   │   ├── index.ts
│   │   └── domain-event.ts
│   └── value-objects/
│       ├── index.ts
│       ├── geo-coordinate.ts
│       └── rating.ts
├── package.json
└── tsconfig.json
```

**File: `libs/motorghar/domain/src/base/entity.ts`**
```typescript
export abstract class Entity<T> {
  protected readonly _id: string;
  protected readonly _type: string;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  protected _deletedAt?: Date;

  constructor(props: {
    id: string;
    type: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }) {
    this._id = props.id;
    this._type = props.type;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._deletedAt = props.deletedAt;
  }

  get id(): string {
    return this._id;
  }

  get type(): string {
    return this._type;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this._deletedAt = new Date();
    this.touch();
  }

  abstract toPersistence(): T;
}
```

**File: `libs/motorghar/domain/src/events/domain-event.ts`**
```typescript
export interface DomainEvent {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class DomainEventFactory {
  static create(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>
  ): DomainEvent {
    return {
      aggregateType,
      aggregateId,
      eventType,
      payload,
      occurredAt: new Date(),
    };
  }
}
```

**File: `libs/motorghar/domain/src/value-objects/geo-coordinate.ts`**
```typescript
export class GeoCoordinate {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  static create(latitude: number, longitude: number): GeoCoordinate {
    return new GeoCoordinate(latitude, longitude);
  }

  static fromString(geoString: string): GeoCoordinate {
    // Parse PostGIS point format: "POINT(lng lat)"
    const match = geoString.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (!match) {
      throw new Error('Invalid geo string format');
    }
    return new GeoCoordinate(parseFloat(match[2]), parseFloat(match[1]));
  }

  toPostGIS(): string {
    return `POINT(${this.longitude} ${this.latitude})`;
  }

  toJSON(): { latitude: number; longitude: number } {
    return { latitude: this.latitude, longitude: this.longitude };
  }
}
```

**File: `libs/motorghar/domain/src/index.ts`**
```typescript
export * from './base/entity';
export * from './events/domain-event';
export * from './value-objects/geo-coordinate';
```

**Validation Command:**
```bash
npx nx build domain
npx nx lint domain
npx nx test domain
```

---

#### 1.4 Create `libs/motorghar/adapters` Package

**Command:**
```bash
npx nx g @nx/node:library adapters --directory=motorghar --importPath=@motorghar/adapters --buildable
```

**File Structure:**
```
libs/motorghar/adapters/
├── src/
│   ├── index.ts
│   ├── outbox/
│   │   ├── index.ts
│   │   └── domain-outbox-writer.ts
│   └── storage/
│       ├── index.ts
│       └── minio-adapter.ts
├── package.json
└── tsconfig.json
```

**File: `libs/motorghar/adapters/src/outbox/domain-outbox-writer.ts`**
```typescript
import { DomainEvent } from '@motorghar/domain';
import { PrismaClient } from '@prisma/client';

export interface DomainOutboxPort {
  append(event: DomainEvent): Promise<void>;
}

export class DomainOutboxWriter implements DomainOutboxPort {
  constructor(private readonly prisma: PrismaClient) {}

  async append(event: DomainEvent): Promise<void> {
    await this.prisma.domainOutbox.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payloadJsonb: event.payload as any,
        occurredAt: event.occurredAt,
      },
    });
  }
}
```

**File: `libs/motorghar/adapters/src/index.ts`**
```typescript
export * from './outbox/domain-outbox-writer';
// storage adapter will be added when needed
```

**Update `libs/motorghar/adapters/package.json` - Add dependencies:**
```json
{
  "dependencies": {
    "@motorghar/domain": "*",
    "@prisma/client": "^5.8.0"
  }
}
```

**Validation Command:**
```bash
npx nx build adapters
npx nx lint adapters
```

---

### Phase 2: Fastify Gateway Setup

#### 2.1 Create Gateway Application

**Command:**
```bash
npx nx g @nx/node:application fastify-gateway --directory=apps/motorghar --framework=fastify
```

**File Structure:**
```
apps/motorghar/fastify-gateway/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── config/
│   │   ├── index.ts
│   │   └── env.ts
│   ├── plugins/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   ├── error-handler.ts
│   │   └── request-logger.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   └── proxy.ts
│   └── utils/
│       ├── index.ts
│       ├── jwt.ts
│       └── response-formatter.ts
├── package.json
└── tsconfig.json
```

#### 2.2 Configuration Setup

**File: `apps/motorghar/fastify-gateway/src/config/env.ts`**
```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
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
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = loadEnv();
```

**File: `apps/motorghar/fastify-gateway/src/config/index.ts`**
```typescript
import { env } from './env';

export const config = {
  env: env.NODE_ENV,
  port: env.PORT_GATEWAY,

  jwt: {
    secret: env.JWT_SECRET,
    expiry: env.JWT_EXPIRY,
  },

  admin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },

  services: {
    catalog: `http://localhost:${env.PORT_SVC_CATALOG}`,
    content: `http://localhost:${env.PORT_SVC_CONTENT}`,
    serviceCenter: `http://localhost:${env.PORT_SVC_SERVICE_CENTER}`,
    garage: `http://localhost:${env.PORT_SVC_GARAGE}`,
  },

  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

export { env };
```

#### 2.3 JWT Utilities

**File: `apps/motorghar/fastify-gateway/src/utils/jwt.ts`**
```typescript
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@motorghar/contracts';
import { config } from '../config';

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
```

**File: `apps/motorghar/fastify-gateway/src/utils/response-formatter.ts`**
```typescript
import { randomUUID } from 'crypto';
import { SuccessResponse, ListResponse, ErrorResponse } from '@motorghar/contracts';

export function formatSuccess<T>(data: T, requestId?: string): SuccessResponse<T> {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || randomUUID(),
    },
  };
}

export function formatList<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number,
  requestId?: string
): ListResponse<T> {
  return {
    data,
    meta: {
      total,
      limit,
      offset,
      timestamp: new Date().toISOString(),
      requestId: requestId || randomUUID(),
    },
  };
}

export function formatError(
  code: string,
  message: string,
  details?: Array<{ field?: string; message: string; code?: string }>,
  requestId?: string
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || randomUUID(),
    },
  };
}
```

#### 2.4 Plugins

**File: `apps/motorghar/fastify-gateway/src/plugins/cors.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';

export const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });
};
```

**File: `apps/motorghar/fastify-gateway/src/plugins/request-logger.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';

export const requestLoggerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const requestId = randomUUID();
    request.headers['x-request-id'] = requestId;

    fastify.log.info({
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
    }, 'Incoming request');
  });

  fastify.addHook('onResponse', async (request, reply) => {
    fastify.log.info({
      requestId: request.headers['x-request-id'],
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime(),
    }, 'Request completed');
  });
};
```

**File: `apps/motorghar/fastify-gateway/src/plugins/error-handler.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { formatError } from '../utils/response-formatter';

export const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    const requestId = request.headers['x-request-id'] as string;

    // Zod validation errors
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

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
```

**File: `apps/motorghar/fastify-gateway/src/plugins/auth.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: 'admin' | 'user';
    };
  }
}

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', null);

  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for login endpoint
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
    } catch (error) {
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
```

**File: `apps/motorghar/fastify-gateway/src/plugins/index.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { corsPlugin } from './cors';
import { requestLoggerPlugin } from './request-logger';
import { errorHandlerPlugin } from './error-handler';
import { authPlugin } from './auth';

export const registerPlugins: FastifyPluginAsync = async (fastify) => {
  // Order matters!
  await fastify.register(corsPlugin);
  await fastify.register(requestLoggerPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(authPlugin);
};
```

#### 2.5 Routes

**File: `apps/motorghar/fastify-gateway/src/routes/auth.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { LoginRequestSchema } from '@motorghar/contracts';
import { signToken } from '../utils/jwt';
import { formatSuccess, formatError } from '../utils/response-formatter';
import { config } from '../config';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/v1/auth/login', async (request, reply) => {
    const requestId = request.headers['x-request-id'] as string;

    try {
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
              role: 'admin',
            },
          },
          requestId
        )
      );
    } catch (error) {
      throw error;
    }
  });

  fastify.get('/v1/auth/me', async (request, reply) => {
    const requestId = request.headers['x-request-id'] as string;

    return reply.status(200).send(
      formatSuccess(
        {
          id: request.user!.userId,
          email: request.user!.email,
          role: request.user!.role,
        },
        requestId
      )
    );
  });
};
```

**File: `apps/motorghar/fastify-gateway/src/routes/proxy.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import proxy from '@fastify/http-proxy';
import { config } from '../config';

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
```

**File: `apps/motorghar/fastify-gateway/src/routes/index.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { authRoutes } from './auth';
import { proxyRoutes } from './proxy';

export const registerRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check
  fastify.get('/health', async () => ({ status: 'ok', service: 'gateway' }));

  // Auth routes
  await fastify.register(authRoutes);

  // Service proxies
  await fastify.register(proxyRoutes);
};
```

#### 2.6 Application Bootstrap

**File: `apps/motorghar/fastify-gateway/src/app.ts`**
```typescript
import Fastify from 'fastify';
import { config } from './config';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';

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
  await registerPlugins(fastify);

  // Register routes
  await registerRoutes(fastify);

  return fastify;
}
```

**File: `apps/motorghar/fastify-gateway/src/main.ts`**
```typescript
import { buildApp } from './app';
import { config } from './config';

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
```

#### 2.7 Update package.json Dependencies

**File: `apps/motorghar/fastify-gateway/package.json`** (add to dependencies):
```json
{
  "dependencies": {
    "@motorghar/contracts": "*",
    "@motorghar/types": "*",
    "fastify": "^4.25.2",
    "@fastify/cors": "^8.4.2",
    "@fastify/http-proxy": "^9.3.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "pino-pretty": "^10.3.1"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

---

### Phase 3: Environment Configuration

**File: Root `.env`** (create if not exists):
```bash
# Environment
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://motorghar:motorghar_dev@localhost:5432/motorghar

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_CATALOG=motorghar-catalog

# Auth (R1 stub)
JWT_SECRET=motorghar-dev-secret-min-32-chars-please-change-in-prod
JWT_EXPIRY=24h
ADMIN_EMAIL=admin@motorghar.test
ADMIN_PASSWORD=admin123

# Service Ports
PORT_GATEWAY=3000
PORT_SVC_CATALOG=3001
PORT_SVC_CONTENT=3002
PORT_SVC_SERVICE_CENTER=3003
PORT_SVC_GARAGE=3004

# Frontend Ports
PORT_ADMIN_CONSOLE=4000
PORT_WEB_MYGARAGE=4001
```

---

### Phase 4: Testing

#### 4.1 Unit Tests for Domain Package

**File: `libs/motorghar/domain/src/value-objects/geo-coordinate.spec.ts`**
```typescript
import { GeoCoordinate } from './geo-coordinate';

describe('GeoCoordinate', () => {
  describe('create', () => {
    it('should create valid coordinate', () => {
      const coord = GeoCoordinate.create(27.7172, 85.3240);
      expect(coord.latitude).toBe(27.7172);
      expect(coord.longitude).toBe(85.3240);
    });

    it('should throw on invalid latitude', () => {
      expect(() => GeoCoordinate.create(91, 85)).toThrow();
      expect(() => GeoCoordinate.create(-91, 85)).toThrow();
    });

    it('should throw on invalid longitude', () => {
      expect(() => GeoCoordinate.create(27, 181)).toThrow();
      expect(() => GeoCoordinate.create(27, -181)).toThrow();
    });
  });

  describe('toPostGIS', () => {
    it('should format as PostGIS POINT', () => {
      const coord = GeoCoordinate.create(27.7172, 85.3240);
      expect(coord.toPostGIS()).toBe('POINT(85.324 27.7172)');
    });
  });

  describe('fromString', () => {
    it('should parse PostGIS POINT', () => {
      const coord = GeoCoordinate.fromString('POINT(85.324 27.7172)');
      expect(coord.latitude).toBe(27.7172);
      expect(coord.longitude).toBe(85.324);
    });
  });
});
```

#### 4.2 Integration Tests for Gateway

**File: `apps/motorghar/fastify-gateway/src/routes/auth.spec.ts`**
```typescript
import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/login', () => {
    it('should return token for valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'admin@motorghar.test',
          password: 'admin123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.role).toBe('admin');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'wrong@email.com',
          password: 'wrongpass',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return user info with valid token', async () => {
      // First login
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'admin@motorghar.test',
          password: 'admin123',
        },
      });

      const { token } = JSON.parse(loginRes.body).data;

      // Then get user info
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.email).toBe('admin@motorghar.test');
    });

    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
```

---

## Validation & Testing Commands

### Build All Packages
```bash
npx nx run-many --target=build --projects=contracts,types,domain,adapters,fastify-gateway
```

### Lint All Packages
```bash
npx nx run-many --target=lint --projects=contracts,types,domain,adapters,fastify-gateway
```

### Test Packages
```bash
npx nx test domain
npx nx test fastify-gateway
```

### Start Gateway
```bash
npx nx serve fastify-gateway
```

### Manual API Testing
```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@motorghar.test","password":"admin123"}'

# Get current user (replace TOKEN)
curl http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## Acceptance Criteria

- [x] All shared libraries build without errors
- [x] Gateway starts on port 3000
- [x] Health endpoint returns `{"status":"ok","service":"gateway"}`
- [x] Login endpoint returns JWT token for valid credentials
- [x] Login endpoint returns 401 for invalid credentials
- [x] All protected routes require Bearer token
- [x] Invalid tokens return 401
- [x] Request/response logging shows correlation IDs
- [x] Error responses follow standardized format
- [x] Unit tests pass for domain package
- [x] Integration tests pass for gateway auth routes
- [x] TypeScript compiles with zero errors
- [x] ESLint passes with zero errors

---

## Next Steps

Once this task is complete:
1. Create git commit: `feat(R1): backend foundation with gateway and auth stub`
2. Proceed to Task 02: Catalog Service
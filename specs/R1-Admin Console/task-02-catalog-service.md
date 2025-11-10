# Task 02: Catalog Service - Vehicle CRUD & Media Upload

**Parent Spec:** `spec.md` (R1 - Admin Console)
**Status:** Not Started
**Estimated Effort:** 3-4 days
**Dependencies:** Task 01 (Backend Foundation) complete

---

## References to Main Spec

- **Service Boundaries:** Section 2.1 - Service Boundaries
- **Hexagonal Architecture:** Section 2.2 - Hexagonal Architecture Pattern
- **Database Schema:** Section 3.1 - Database Schema (vehicle_catalog, vehicle_variant tables)
- **API Contracts:** Section 4.2 - Gateway Routes
- **Media Upload:** Section 7 - Media Upload Strategy
- **Testing:** Section 8 - Testing Strategy

---

## Objective

Build the Catalog Service microservice with:
1. Complete CRUD operations for vehicle catalog entries
2. Complete CRUD operations for vehicle variants
3. Media upload integration with MinIO
4. Prisma repository implementation
5. Domain outbox event logging
6. Comprehensive unit and integration tests

---

## Step-by-Step Implementation

### Phase 1: Prisma Schema & Migrations

#### 1.1 Update Prisma Schema

**File: `prisma/schema.prisma`** (add to existing schema):
```prisma
model VehicleCatalog {
  id        String   @id @default(uuid())
  make      String   @db.VarChar(100)
  model     String   @db.VarChar(100)
  year      Int
  trim      String?  @db.VarChar(100)
  fuelType  String?  @map("fuel_type") @db.VarChar(50)
  specs     Json     @default("{}")
  media     String[] @default([])

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  variants VehicleVariant[]

  @@unique([make, model, year, trim], name: "uq_vehicle_catalog")
  @@index([make, model], name: "idx_catalog_make_model")
  @@index([year], name: "idx_catalog_year")
  @@index([deletedAt], name: "idx_catalog_deleted")
  @@map("vehicle_catalog")
}

model VehicleVariant {
  id         String   @id @default(uuid())
  catalogId  String   @map("catalog_id")
  name       String   @db.VarChar(100)
  specs      Json     @default("{}")

  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  catalog VehicleCatalog @relation(fields: [catalogId], references: [id], onDelete: Cascade)

  @@unique([catalogId, name], name: "uq_variant_name")
  @@map("vehicle_variant")
}
```

#### 1.2 Create Migration

**Commands:**
```bash
npx prisma migrate dev --name add_vehicle_catalog_tables
npx prisma generate
```

---

### Phase 2: Contracts & Types

#### 2.1 Catalog Contracts

**File: `libs/shared/contracts/src/catalog/vehicle-catalog.ts`**
```typescript
import { z } from 'zod';

// Request schemas
export const CreateVehicleCatalogSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().gte(1900).lte(new Date().getFullYear() + 2),
  trim: z.string().max(100).optional(),
  fuelType: z.string().max(50).optional(),
  specs: z.record(z.string(), z.any()).default({}),
  media: z.array(z.string().url()).default([]),
});

export const UpdateVehicleCatalogSchema = CreateVehicleCatalogSchema.partial();

export const VehicleCatalogQuerySchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  search: z.string().optional(), // For combined make/model search
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// Response schema
export const VehicleCatalogSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('vehicle.catalog#v1'),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  trim: z.string().optional(),
  fuelType: z.string().optional(),
  specs: z.record(z.string(), z.any()),
  media: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().optional(),
});

// Types
export type CreateVehicleCatalog = z.infer<typeof CreateVehicleCatalogSchema>;
export type UpdateVehicleCatalog = z.infer<typeof UpdateVehicleCatalogSchema>;
export type VehicleCatalogQuery = z.infer<typeof VehicleCatalogQuerySchema>;
export type VehicleCatalog = z.infer<typeof VehicleCatalogSchema>;
```

**File: `libs/shared/contracts/src/catalog/vehicle-variant.ts`**
```typescript
import { z } from 'zod';

export const CreateVehicleVariantSchema = z.object({
  catalogId: z.string().uuid(),
  name: z.string().min(1).max(100),
  specs: z.record(z.string(), z.any()).default({}),
});

export const UpdateVehicleVariantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  specs: z.record(z.string(), z.any()).optional(),
});

export const VehicleVariantSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('vehicle.variant#v1'),
  catalogId: z.string().uuid(),
  name: z.string(),
  specs: z.record(z.string(), z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateVehicleVariant = z.infer<typeof CreateVehicleVariantSchema>;
export type UpdateVehicleVariant = z.infer<typeof UpdateVehicleVariantSchema>;
export type VehicleVariant = z.infer<typeof VehicleVariantSchema>;
```

**File: `libs/shared/contracts/src/catalog/index.ts`**
```typescript
export * from './vehicle-catalog';
export * from './vehicle-variant';
```

**Update: `libs/shared/contracts/src/index.ts`**
```typescript
export * from './common/responses';
export * from './common/pagination';
export * from './auth/auth';
export * from './catalog';
```

---

### Phase 3: Catalog Service Application

#### 3.1 Create Catalog Service

**Command:**
```bash
npx nx g @nx/node:application svc-catalog --directory=apps/motorghar --framework=fastify
```

**File Structure:**
```
apps/motorghar/svc-catalog/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── config/
│   │   ├── index.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── catalog.controller.ts
│   │   └── variant.controller.ts
│   ├── app/
│   │   └── use-cases/
│   │       ├── catalog/
│   │       │   ├── create-catalog.ts
│   │       │   ├── get-catalog.ts
│   │       │   ├── list-catalog.ts
│   │       │   ├── update-catalog.ts
│   │       │   ├── delete-catalog.ts
│   │       │   └── upload-media.ts
│   │       └── variant/
│   │           ├── create-variant.ts
│   │           ├── list-variants.ts
│   │           ├── update-variant.ts
│   │           └── delete-variant.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── catalog.entity.ts
│   │   │   └── variant.entity.ts
│   │   └── events/
│   │       └── catalog.events.ts
│   ├── ports/
│   │   ├── repositories/
│   │   │   ├── catalog.repository.ts
│   │   │   └── variant.repository.ts
│   │   ├── events/
│   │   │   └── outbox.port.ts
│   │   └── storage/
│   │       └── media-storage.port.ts
│   └── adapters/
│       ├── db/
│       │   ├── catalog.repository.impl.ts
│       │   └── variant.repository.impl.ts
│       └── storage/
│           └── minio-storage.adapter.ts
├── package.json
└── tsconfig.json
```

#### 3.2 Configuration

**File: `apps/motorghar/svc-catalog/src/config/env.ts`**
```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT_SVC_CATALOG: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),

  // MinIO
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.coerce.number(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_BUCKET_CATALOG: z.string().default('motorghar-catalog'),

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

**File: `apps/motorghar/svc-catalog/src/config/index.ts`**
```typescript
import { env } from './env';

export const config = {
  env: env.NODE_ENV,
  port: env.PORT_SVC_CATALOG,
  database: {
    url: env.DATABASE_URL,
  },
  minio: {
    endpoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    useSSL: env.MINIO_USE_SSL,
    bucket: env.MINIO_BUCKET_CATALOG,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

export { env };
```

#### 3.3 Domain Layer

**File: `apps/motorghar/svc-catalog/src/domain/entities/catalog.entity.ts`**
```typescript
import { Entity } from '@motorghar/domain';
import { EntityType } from '@motorghar/types';

export interface CatalogProps {
  id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  fuelType?: string;
  specs: Record<string, any>;
  media: string[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class CatalogEntity extends Entity<CatalogProps> {
  private constructor(private props: CatalogProps) {
    super({
      id: props.id,
      type: EntityType.VEHICLE_CATALOG,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
  }

  static create(props: Omit<CatalogProps, 'id' | 'createdAt' | 'updatedAt'>): CatalogEntity {
    return new CatalogEntity({
      ...props,
      id: crypto.randomUUID(),
    });
  }

  static fromPersistence(props: CatalogProps): CatalogEntity {
    return new CatalogEntity(props);
  }

  get make(): string {
    return this.props.make;
  }

  get model(): string {
    return this.props.model;
  }

  get year(): number {
    return this.props.year;
  }

  get trim(): string | undefined {
    return this.props.trim;
  }

  get fuelType(): string | undefined {
    return this.props.fuelType;
  }

  get specs(): Record<string, any> {
    return this.props.specs;
  }

  get media(): string[] {
    return this.props.media;
  }

  update(updates: Partial<Omit<CatalogProps, 'id'>>) {
    Object.assign(this.props, updates);
    this.touch();
  }

  addMedia(url: string) {
    this.props.media.push(url);
    this.touch();
  }

  removeMedia(url: string) {
    this.props.media = this.props.media.filter((m) => m !== url);
    this.touch();
  }

  toPersistence(): CatalogProps {
    return {
      id: this._id,
      make: this.props.make,
      model: this.props.model,
      year: this.props.year,
      trim: this.props.trim,
      fuelType: this.props.fuelType,
      specs: this.props.specs,
      media: this.props.media,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  toResponse() {
    return {
      id: this._id,
      type: this._type,
      make: this.props.make,
      model: this.props.model,
      year: this.props.year,
      trim: this.props.trim,
      fuelType: this.props.fuelType,
      specs: this.props.specs,
      media: this.props.media,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deletedAt: this._deletedAt?.toISOString(),
    };
  }
}
```

**File: `apps/motorghar/svc-catalog/src/domain/events/catalog.events.ts`**
```typescript
export const CatalogEvents = {
  CREATED: 'CatalogVehicleCreated#v1',
  UPDATED: 'CatalogVehicleUpdated#v1',
  DELETED: 'CatalogVehicleDeleted#v1',
  MEDIA_ADDED: 'CatalogMediaAdded#v1',
} as const;
```

#### 3.4 Ports

**File: `apps/motorghar/svc-catalog/src/ports/repositories/catalog.repository.ts`**
```typescript
import { CatalogEntity } from '../../domain/entities/catalog.entity';

export interface CatalogQueryOptions {
  make?: string;
  model?: string;
  year?: number;
  search?: string;
  limit: number;
  offset: number;
  includeDeleted?: boolean;
}

export interface CatalogRepository {
  create(entity: CatalogEntity): Promise<CatalogEntity>;
  findById(id: string, includeDeleted?: boolean): Promise<CatalogEntity | null>;
  findMany(options: CatalogQueryOptions): Promise<{ items: CatalogEntity[]; total: number }>;
  update(entity: CatalogEntity): Promise<CatalogEntity>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
```

**File: `apps/motorghar/svc-catalog/src/ports/storage/media-storage.port.ts`**
```typescript
export interface MediaStoragePort {
  uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string>;
  deleteFile(url: string): Promise<void>;
  generatePresignedUrl(filename: string, expirySeconds?: number): Promise<string>;
}
```

#### 3.5 Adapters

**File: `apps/motorghar/svc-catalog/src/adapters/db/catalog.repository.impl.ts`**
```typescript
import { PrismaClient } from '@prisma/client';
import { CatalogEntity } from '../../domain/entities/catalog.entity';
import { CatalogRepository, CatalogQueryOptions } from '../../ports/repositories/catalog.repository';

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(entity: CatalogEntity): Promise<CatalogEntity> {
    const data = entity.toPersistence();

    const created = await this.prisma.vehicleCatalog.create({
      data: {
        id: data.id,
        make: data.make,
        model: data.model,
        year: data.year,
        trim: data.trim,
        fuelType: data.fuelType,
        specs: data.specs,
        media: data.media,
      },
    });

    return CatalogEntity.fromPersistence({
      ...created,
      specs: created.specs as Record<string, any>,
      deletedAt: created.deletedAt || undefined,
    });
  }

  async findById(id: string, includeDeleted = false): Promise<CatalogEntity | null> {
    const where: any = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const found = await this.prisma.vehicleCatalog.findFirst({ where });

    if (!found) return null;

    return CatalogEntity.fromPersistence({
      ...found,
      specs: found.specs as Record<string, any>,
      deletedAt: found.deletedAt || undefined,
    });
  }

  async findMany(options: CatalogQueryOptions): Promise<{ items: CatalogEntity[]; total: number }> {
    const where: any = {};

    if (!options.includeDeleted) {
      where.deletedAt = null;
    }

    if (options.make) {
      where.make = { contains: options.make, mode: 'insensitive' };
    }

    if (options.model) {
      where.model = { contains: options.model, mode: 'insensitive' };
    }

    if (options.year) {
      where.year = options.year;
    }

    if (options.search) {
      where.OR = [
        { make: { contains: options.search, mode: 'insensitive' } },
        { model: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.vehicleCatalog.findMany({
        where,
        skip: options.offset,
        take: options.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicleCatalog.count({ where }),
    ]);

    return {
      items: items.map((item) =>
        CatalogEntity.fromPersistence({
          ...item,
          specs: item.specs as Record<string, any>,
          deletedAt: item.deletedAt || undefined,
        })
      ),
      total,
    };
  }

  async update(entity: CatalogEntity): Promise<CatalogEntity> {
    const data = entity.toPersistence();

    const updated = await this.prisma.vehicleCatalog.update({
      where: { id: data.id },
      data: {
        make: data.make,
        model: data.model,
        year: data.year,
        trim: data.trim,
        fuelType: data.fuelType,
        specs: data.specs,
        media: data.media,
        updatedAt: data.updatedAt,
      },
    });

    return CatalogEntity.fromPersistence({
      ...updated,
      specs: updated.specs as Record<string, any>,
      deletedAt: updated.deletedAt || undefined,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vehicleCatalog.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.vehicleCatalog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

**File: `apps/motorghar/svc-catalog/src/adapters/storage/minio-storage.adapter.ts`**
```typescript
import * as Minio from 'minio';
import { MediaStoragePort } from '../../ports/storage/media-storage.port';
import { config } from '../../config';

export class MinioStorageAdapter implements MediaStoragePort {
  private client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }

  async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(config.minio.bucket);
    if (!exists) {
      await this.client.makeBucket(config.minio.bucket, 'us-east-1');
      // Set public read policy for catalog bucket
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${config.minio.bucket}/*`],
          },
        ],
      };
      await this.client.setBucketPolicy(config.minio.bucket, JSON.stringify(policy));
    }
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    await this.ensureBucket();

    const objectName = `${Date.now()}-${filename}`;

    await this.client.putObject(config.minio.bucket, objectName, file, file.length, {
      'Content-Type': contentType,
      ...metadata,
    });

    // Return public URL
    const protocol = config.minio.useSSL ? 'https' : 'http';
    return `${protocol}://${config.minio.endpoint}:${config.minio.port}/${config.minio.bucket}/${objectName}`;
  }

  async deleteFile(url: string): Promise<void> {
    // Extract object name from URL
    const objectName = url.split('/').pop();
    if (!objectName) return;

    await this.client.removeObject(config.minio.bucket, objectName);
  }

  async generatePresignedUrl(filename: string, expirySeconds = 3600): Promise<string> {
    return await this.client.presignedGetObject(config.minio.bucket, filename, expirySeconds);
  }
}
```

#### 3.6 Use Cases

**File: `apps/motorghar/svc-catalog/src/app/use-cases/catalog/create-catalog.ts`**
```typescript
import { CreateVehicleCatalog } from '@motorghar/contracts';
import { DomainOutboxPort } from '@motorghar/adapters';
import { DomainEventFactory } from '@motorghar/domain';
import { CatalogEntity } from '../../../domain/entities/catalog.entity';
import { CatalogRepository } from '../../../ports/repositories/catalog.repository';
import { CatalogEvents } from '../../../domain/events/catalog.events';

export class CreateCatalogUseCase {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly outbox: DomainOutboxPort
  ) {}

  async execute(input: CreateVehicleCatalog): Promise<CatalogEntity> {
    const entity = CatalogEntity.create(input);

    const saved = await this.repository.create(entity);

    const event = DomainEventFactory.create(
      'vehicle.catalog#v1',
      saved.id,
      CatalogEvents.CREATED,
      { ...input, id: saved.id }
    );

    await this.outbox.append(event);

    return saved;
  }
}
```

**File: `apps/motorghar/svc-catalog/src/app/use-cases/catalog/upload-media.ts`**
```typescript
import { DomainOutboxPort } from '@motorghar/adapters';
import { DomainEventFactory } from '@motorghar/domain';
import { CatalogRepository } from '../../../ports/repositories/catalog.repository';
import { MediaStoragePort } from '../../../ports/storage/media-storage.port';
import { CatalogEvents } from '../../../domain/events/catalog.events';

export class UploadCatalogMediaUseCase {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly storage: MediaStoragePort,
    private readonly outbox: DomainOutboxPort
  ) {}

  async execute(
    catalogId: string,
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const catalog = await this.repository.findById(catalogId);
    if (!catalog) {
      throw new Error('Catalog not found');
    }

    const url = await this.storage.uploadFile(file, filename, contentType, {
      catalogId,
    });

    catalog.addMedia(url);
    await this.repository.update(catalog);

    const event = DomainEventFactory.create(
      'vehicle.catalog#v1',
      catalogId,
      CatalogEvents.MEDIA_ADDED,
      { catalogId, mediaUrl: url }
    );

    await this.outbox.append(event);

    return url;
  }
}
```

*(Similar use-cases for list, get, update, delete - follow the same pattern)*

#### 3.7 Controllers

**File: `apps/motorghar/svc-catalog/src/controllers/catalog.controller.ts`**
```typescript
import { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import {
  CreateVehicleCatalogSchema,
  UpdateVehicleCatalogSchema,
  VehicleCatalogQuerySchema,
} from '@motorghar/contracts';
import { CreateCatalogUseCase } from '../app/use-cases/catalog/create-catalog';
import { UploadCatalogMediaUseCase } from '../app/use-cases/catalog/upload-media';
// Import other use cases...

export const catalogController: FastifyPluginAsync = async (fastify) => {
  // Initialize dependencies (would be injected in real app)
  const { catalogRepository, outbox, storage } = (fastify as any).diContainer;

  // POST /vehicles - Create catalog entry
  fastify.post('/vehicles', async (request, reply) => {
    const body = CreateVehicleCatalogSchema.parse(request.body);

    const useCase = new CreateCatalogUseCase(catalogRepository, outbox);
    const result = await useCase.execute(body);

    return reply.status(201).send({
      data: result.toResponse(),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  });

  // GET /vehicles - List catalog entries
  fastify.get('/vehicles', async (request, reply) => {
    const query = VehicleCatalogQuerySchema.parse(request.query);

    const { items, total } = await catalogRepository.findMany(query);

    return reply.send({
      data: items.map((item) => item.toResponse()),
      meta: {
        total,
        limit: query.limit,
        offset: query.offset,
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  });

  // GET /vehicles/:id - Get single catalog entry
  fastify.get('/vehicles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const catalog = await catalogRepository.findById(id);
    if (!catalog) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Catalog entry not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }

    return reply.send({
      data: catalog.toResponse(),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  });

  // PATCH /vehicles/:id - Update catalog entry
  fastify.patch('/vehicles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateVehicleCatalogSchema.parse(request.body);

    const catalog = await catalogRepository.findById(id);
    if (!catalog) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Catalog entry not found' },
        meta: { timestamp: new Date().toISOString(), requestId: request.id },
      });
    }

    catalog.update(body);
    const updated = await catalogRepository.update(catalog);

    return reply.send({
      data: updated.toResponse(),
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
    });
  });

  // DELETE /vehicles/:id - Soft delete catalog entry
  fastify.delete('/vehicles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await catalogRepository.softDelete(id);

    return reply.status(204).send();
  });

  // POST /vehicles/:id/media - Upload media
  await fastify.register(multipart);

  fastify.post('/vehicles/:id/media', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
        meta: { timestamp: new Date().toISOString(), requestId: request.id },
      });
    }

    const buffer = await data.toBuffer();
    const useCase = new UploadCatalogMediaUseCase(catalogRepository, storage, outbox);

    const url = await useCase.execute(id, buffer, data.filename, data.mimetype);

    return reply.status(201).send({
      data: { url },
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
    });
  });
};
```

#### 3.8 Application Bootstrap

**File: `apps/motorghar/svc-catalog/src/app.ts`**
```typescript
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { DomainOutboxWriter } from '@motorghar/adapters';
import { config } from './config';
import { catalogController } from './controllers/catalog.controller';
import { PrismaCatalogRepository } from './adapters/db/catalog.repository.impl';
import { MinioStorageAdapter } from './adapters/storage/minio-storage.adapter';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: config.logging.level,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // Initialize dependencies
  const prisma = new PrismaClient();
  const catalogRepository = new PrismaCatalogRepository(prisma);
  const outbox = new DomainOutboxWriter(prisma);
  const storage = new MinioStorageAdapter();

  // Simple DI container
  (fastify as any).diContainer = {
    catalogRepository,
    outbox,
    storage,
    prisma,
  };

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', service: 'catalog' }));

  // Register controllers
  await fastify.register(catalogController);

  // Cleanup on shutdown
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return fastify;
}
```

**File: `apps/motorghar/svc-catalog/src/main.ts`**
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

    console.log(`🚗 Catalog Service running on http://localhost:${config.port}`);
  } catch (error) {
    console.error('❌ Failed to start catalog service:', error);
    process.exit(1);
  }
}

start();
```

---

### Phase 4: Testing

#### 4.1 Unit Tests for Use Cases

**File: `apps/motorghar/svc-catalog/src/app/use-cases/catalog/create-catalog.spec.ts`**
```typescript
import { CreateCatalogUseCase } from './create-catalog';

describe('CreateCatalogUseCase', () => {
  it('should create catalog and emit event', async () => {
    const mockRepo = {
      create: jest.fn().mockResolvedValue({
        id: 'catalog-1',
        toResponse: () => ({ id: 'catalog-1', make: 'Honda' }),
      }),
    };

    const mockOutbox = {
      append: jest.fn(),
    };

    const useCase = new CreateCatalogUseCase(mockRepo as any, mockOutbox as any);

    const result = await useCase.execute({
      make: 'Honda',
      model: 'CBR250R',
      year: 2024,
      specs: {},
      media: [],
    });

    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockOutbox.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'CatalogVehicleCreated#v1',
      })
    );
  });
});
```

#### 4.2 Integration Tests

**File: `apps/motorghar/svc-catalog/src/controllers/catalog.controller.spec.ts`**
```typescript
import { buildApp } from '../app';

describe('Catalog Controller', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /vehicles', () => {
    it('should create catalog entry', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload: {
          make: 'Honda',
          model: 'CBR250R',
          year: 2024,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.id).toBeDefined();
      expect(body.data.make).toBe('Honda');
    });

    it('should validate input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload: {
          make: 'Honda',
          year: 1800, // Invalid year
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
```

---

## Validation & Testing Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev

# Build service
npx nx build svc-catalog

# Lint
npx nx lint svc-catalog

# Test
npx nx test svc-catalog

# Start service
npx nx serve svc-catalog

# Test API manually
curl http://localhost:3001/health

curl -X POST http://localhost:3001/vehicles \
  -H "Content-Type: application/json" \
  -d '{"make":"Honda","model":"CBR250R","year":2024}'
```

---

## Acceptance Criteria

- [ ] Prisma migration applied successfully
- [ ] Service starts on port 3001
- [ ] Health endpoint returns OK
- [ ] Can create catalog entry via POST /vehicles
- [ ] Can list catalog entries via GET /vehicles
- [ ] Can get single entry via GET /vehicles/:id
- [ ] Can update entry via PATCH /vehicles/:id
- [ ] Can soft-delete via DELETE /vehicles/:id
- [ ] Can upload media files via POST /vehicles/:id/media
- [ ] Media files stored in MinIO
- [ ] Domain events logged to outbox table
- [ ] Unit tests pass with 80%+ coverage
- [ ] Integration tests pass
- [ ] Input validation works (Zod)
- [ ] Error responses follow standard format

---

## Next Steps

After completion:
1. Commit: `feat(R1): add catalog service with CRUD and media upload`
2. Proceed to Task 03: Service Center Service
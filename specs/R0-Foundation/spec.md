# R0 – Foundation Phase Specification

**Phase:** R0 – Foundation
**Status:** In Progress
**Dependencies:** Nx workspace structure (already created)
**Target:** Establish infrastructure, database, Prisma setup, and verify all apps build and run

---

## Objective

Setup the foundational infrastructure for MotorGhar including Docker services, database schema with Prisma, and ensure all Nx apps/libs are properly wired and can build/run successfully.

---

## Success Criteria

- ✅ Docker Compose running Postgres (with PostGIS), Redis, MinIO
- ✅ `infra/.env` configured for Docker services
- ✅ Root `.env` and `.env.example` configured for applications
- ✅ All application ports defined and documented
- ✅ Prisma schema defined with all core tables
- ✅ Nx targets configured for Prisma operations (generate, migrate, seed)
- ✅ Initial migration applied successfully
- ✅ Seed data script created and executable
- ✅ All apps build without errors (`nx run-many --target=build --all`)
- ✅ All apps can be served as local processes on their assigned ports
- ✅ Health endpoints implemented for all backend services
- ✅ Database connection verified from apps
- ✅ MinIO buckets created and accessible
- ✅ Redis connection verified from apps

---

## Deliverables

### 1. Docker Infrastructure

**File:** `infra/docker-compose.yml`

**Services:**
```yaml
services:
  postgres:
    - PostgreSQL 16 with PostGIS extension
    - Port: 5432
    - Database: motorghar
    - Volume for data persistence

  redis:
    - Redis 7
    - Port: 6379
    - Volume for persistence

  minio:
    - MinIO (S3-compatible storage)
    - Port: 9000 (API), 9001 (Console)
    - Pre-configured buckets: vehicle-media, content-media
    - Access/Secret keys configured

  pgadmin (optional):
    - Port: 5050
    - For DB management UI
```

**Docker Environment File:** `infra/.env`

```env
# PostgreSQL
POSTGRES_USER=motorghar
POSTGRES_PASSWORD=motorghar123
POSTGRES_DB=motorghar
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001

# pgAdmin (optional)
PGADMIN_EMAIL=admin@motorghar.local
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

**Quick Start:**
```bash
cd infra
docker-compose up -d
docker-compose ps  # Verify all healthy
```

---

### 1.1 Port Allocation

**Infrastructure Services (Docker):**

| Service    | Port  | Access URL                 | Purpose           |
|------------|-------|----------------------------|-------------------|
| PostgreSQL | 5432  | localhost:5432             | Database          |
| Redis      | 6379  | localhost:6379             | Cache/Sessions    |
| MinIO API  | 9000  | localhost:9000             | Object Storage    |
| MinIO UI   | 9001  | http://localhost:9001      | Storage Console   |
| pgAdmin    | 5050  | http://localhost:5050      | DB Management     |

**Application Services (Local Processes):**

| Service                | Port | Access URL                  | Purpose                    |
|------------------------|------|-----------------------------|----------------------------|
| fastify-gateway        | 3000 | http://localhost:3000       | API Gateway                |
| svc-catalog            | 3001 | http://localhost:3001       | Catalog Microservice       |
| svc-content            | 3002 | http://localhost:3002       | Content Microservice       |
| svc-service-center     | 3003 | http://localhost:3003       | Service Center Service     |
| svc-garage             | 3004 | http://localhost:3004       | Garage Microservice        |
| web-admin-console      | 4000 | http://localhost:4000       | Admin Web App (Next.js)    |
| web-mygarage           | 4001 | http://localhost:4001       | User Web App (Next.js)     |
| mobile-mygarage (metro)| 8081 | http://localhost:8081       | React Native Metro Bundler |

**Note:** All application ports should be configurable via environment variables.

---

### 1.2 Development Strategy

**R0 Focus: Running Apps as Local Processes**

For development, all applications run as local Node.js processes:
- Faster iteration and debugging
- Direct access to logs and console output
- Easy to restart individual services
- Native TypeScript/Node.js debugging support

**Docker Usage in R0:**
- Infrastructure only (Postgres, Redis, MinIO)
- Applications run via `nx serve <app-name>`
- Each app connects to Dockerized infrastructure

**Future (Post-R0):**
- Dockerfiles for each service (optional in R0)
- `docker-compose.services.yml` for full stack deployment
- Production-ready container images

---

### 2. Database Schema (Prisma)

**File:** `prisma/schema.prisma` (or per-service if multi-schema)

**Initial Tables:**

#### Core Tables (All Services)
```prisma
// Outbox pattern for event-driven architecture
model DomainOutbox {
  id             String    @id @default(uuid()) @db.Uuid
  aggregateType  String    @map("aggregate_type") @db.VarChar(100)
  aggregateId    String    @map("aggregate_id") @db.VarChar(100)
  eventType      String    @map("event_type") @db.VarChar(100)
  payloadJsonb   Json      @map("payload_jsonb") @db.JsonB
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  processedAt    DateTime? @map("processed_at") @db.Timestamp(6)

  @@index([processedAt], map: "idx_outbox_processed")
  @@map("domain_outbox")
}
```

#### Catalog Service Tables
```prisma
model VehicleCatalog {
  id         String    @id @default(uuid()) @db.Uuid
  make       String    @db.VarChar(100)
  model      String    @db.VarChar(100)
  year       Int
  trim       String?   @db.VarChar(100)
  fuelType   String?   @map("fuel_type") @db.VarChar(50)
  specsJsonb Json      @default("{}") @map("specs_jsonb") @db.JsonB
  media      String[]  @default([])
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt  DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  deletedAt  DateTime? @map("deleted_at") @db.Timestamp(6)

  variants       VehicleVariant[]
  ownerVehicles  OwnerVehicle[]

  @@index([make, model, year])
  @@index([deletedAt])
  @@map("vehicle_catalog")
}

model VehicleVariant {
  id         String   @id @default(uuid()) @db.Uuid
  catalogId  String   @map("catalog_id") @db.Uuid
  name       String   @db.VarChar(100)
  specsJsonb Json     @default("{}") @map("specs_jsonb") @db.JsonB
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamp(6)

  catalog VehicleCatalog @relation(fields: [catalogId], references: [id], onDelete: Cascade)

  @@index([catalogId])
  @@map("vehicle_variant")
}
```

#### Garage Service Tables
```prisma
model OwnerVehicle {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.VarChar(100)
  catalogId   String    @map("catalog_id") @db.Uuid
  nickname    String?   @db.VarChar(200)
  odoKm       Int?      @map("odo_km")
  fieldsJsonb Json      @default("{}") @map("fields_jsonb") @db.JsonB
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamp(6)

  catalog      VehicleCatalog        @relation(fields: [catalogId], references: [id])
  notes        OwnerVehicleNote[]
  media        OwnerVehicleMedia[]
  reviews      OwnerVehicleReview[]
  appointments ServiceAppointment[]

  @@index([userId])
  @@index([catalogId])
  @@index([deletedAt])
  @@map("owner_vehicle")
}

model OwnerVehicleNote {
  id             String   @id @default(uuid()) @db.Uuid
  ownerVehicleId String   @map("owner_vehicle_id") @db.Uuid
  body           String   @db.Text
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  ownerVehicle OwnerVehicle @relation(fields: [ownerVehicleId], references: [id], onDelete: Cascade)

  @@index([ownerVehicleId])
  @@map("owner_vehicle_note")
}

model OwnerVehicleMedia {
  id             String   @id @default(uuid()) @db.Uuid
  ownerVehicleId String   @map("owner_vehicle_id") @db.Uuid
  url            String   @db.VarChar(500)
  kind           String   @db.VarChar(50) // 'image' | 'video'
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamp(6)

  ownerVehicle OwnerVehicle @relation(fields: [ownerVehicleId], references: [id], onDelete: Cascade)

  @@index([ownerVehicleId])
  @@map("owner_vehicle_media")
}

model OwnerVehicleReview {
  id             String   @id @default(uuid()) @db.Uuid
  ownerVehicleId String   @map("owner_vehicle_id") @db.Uuid
  rating         Int      @db.SmallInt // 1-5
  comment        String?  @db.Text
  approved       Boolean  @default(false)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  ownerVehicle OwnerVehicle @relation(fields: [ownerVehicleId], references: [id], onDelete: Cascade)

  @@index([ownerVehicleId])
  @@index([approved])
  @@map("owner_vehicle_review")
}
```

#### Service Center Tables
```prisma
model ServiceCenter {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @db.VarChar(200)
  address   String   @db.VarChar(500)
  phone     String?  @db.VarChar(50)
  email     String?  @db.VarChar(200)
  latitude  Float
  longitude Float
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  appointments ServiceAppointment[]

  @@index([latitude, longitude])
  @@map("service_center")
}

model ServiceAppointment {
  id             String    @id @default(uuid()) @db.Uuid
  ownerVehicleId String    @map("owner_vehicle_id") @db.Uuid
  centerId       String    @map("center_id") @db.Uuid
  slotTs         DateTime  @map("slot_ts") @db.Timestamp(6)
  status         String    @db.VarChar(50) // 'pending', 'confirmed', 'cancelled', 'completed'
  notes          String?   @db.Text
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)

  ownerVehicle OwnerVehicle  @relation(fields: [ownerVehicleId], references: [id])
  center       ServiceCenter @relation(fields: [centerId], references: [id])

  @@index([ownerVehicleId])
  @@index([centerId])
  @@index([slotTs])
  @@index([status])
  @@map("service_appointment")
}
```

#### Content Service Tables
```prisma
model ContentPost {
  id         String    @id @default(uuid()) @db.Uuid
  type       String    @db.VarChar(50) // 'news', 'event', 'video', 'recall'
  title      String    @db.VarChar(300)
  bodyMd     String    @map("body_md") @db.Text
  vehicleIds String[]  @map("vehicle_ids") @default([])
  status     String    @db.VarChar(50) // 'draft', 'published'
  publishAt  DateTime? @map("publish_at") @db.Timestamp(6)
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt  DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)

  @@index([type])
  @@index([status])
  @@index([publishAt])
  @@map("content_post")
}
```

---

### 3. Nx Prisma Integration

**Configure Nx targets in `project.json` for each service or at workspace level:**

```json
{
  "targets": {
    "prisma:generate": {
      "executor": "nx:run-commands",
      "options": {
        "command": "prisma generate",
        "cwd": "prisma"
      }
    },
    "prisma:migrate": {
      "executor": "nx:run-commands",
      "options": {
        "command": "prisma migrate dev",
        "cwd": "prisma"
      }
    },
    "prisma:migrate:deploy": {
      "executor": "nx:run-commands",
      "options": {
        "command": "prisma migrate deploy",
        "cwd": "prisma"
      }
    },
    "prisma:seed": {
      "executor": "nx:run-commands",
      "options": {
        "command": "prisma db seed",
        "cwd": "prisma"
      }
    },
    "prisma:studio": {
      "executor": "nx:run-commands",
      "options": {
        "command": "prisma studio",
        "cwd": "prisma"
      }
    }
  }
}
```

**Seed Script:** `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Seed Catalog
  const bike1 = await prisma.vehicleCatalog.create({
    data: {
      make: 'Honda',
      model: 'CBR250R',
      year: 2023,
      trim: 'Standard',
      fuelType: 'Petrol',
      specsJsonb: {
        engine: '249.6cc',
        power: '26.5 HP',
        torque: '22.9 Nm'
      },
      media: []
    }
  });

  // Seed Service Centers
  const center1 = await prisma.serviceCenter.create({
    data: {
      name: 'BikersNepal Service Center',
      address: 'Kathmandu, Nepal',
      phone: '+977-1-4444444',
      latitude: 27.7172,
      longitude: 85.3240
    }
  });

  // Seed Content
  await prisma.contentPost.create({
    data: {
      type: 'news',
      title: 'Honda CBR250R Launch Event',
      bodyMd: '# Honda launches new CBR250R\n\nGreat bike for enthusiasts!',
      status: 'published',
      vehicleIds: [bike1.id],
      publishAt: new Date()
    }
  });

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

### 4. Environment Configuration

**Root `.env`:**
```env
# Database
DATABASE_URL="postgresql://motorghar:motorghar123@localhost:5432/motorghar?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minio"
MINIO_SECRET_KEY="minio123"
MINIO_USE_SSL="false"

# Application Ports
PORT_GATEWAY=3000
PORT_SVC_CATALOG=3001
PORT_SVC_CONTENT=3002
PORT_SVC_SERVICE_CENTER=3003
PORT_SVC_GARAGE=3004
PORT_WEB_ADMIN=4000
PORT_WEB_MYGARAGE=4001
PORT_MOBILE_METRO=8081

# Application
NODE_ENV="development"
LOG_LEVEL="debug"

# JWT (stub for now)
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="24h"
```

**`.env.example`:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/motorghar?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_USE_SSL="false"

# Application Ports
PORT_GATEWAY=3000
PORT_SVC_CATALOG=3001
PORT_SVC_CONTENT=3002
PORT_SVC_SERVICE_CENTER=3003
PORT_SVC_GARAGE=3004
PORT_WEB_ADMIN=4000
PORT_WEB_MYGARAGE=4001
PORT_MOBILE_METRO=8081

# Application
NODE_ENV="development"
LOG_LEVEL="debug"

# JWT
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN="24h"
```

---

### 5. Build & Run Verification

**Commands to Execute:**

```bash
# Install dependencies
pnpm install

# Start infrastructure
cd infra && docker-compose up -d

# Generate Prisma Client
nx run prisma:generate

# Run migrations
nx run prisma:migrate

# Seed database
nx run prisma:seed

# Build all apps
nx run-many --target=build --all

# Test individual app runs (sanity check)
nx serve fastify-gateway
nx serve web-admin-console
nx serve web-mygarage
# ... etc for each app
```

**Expected Outcomes:**
- All builds complete without errors
- Each app starts and shows minimal health endpoint or "Hello World"
- Database tables created successfully
- Seed data visible in database
- No TypeScript or linting errors

---

## Validation Checklist

### Infrastructure
- [ ] `infra/.env` created with Docker service configuration
- [ ] Docker Compose up and all services healthy (`docker-compose ps`)
- [ ] PostgreSQL accessible on port 5432
- [ ] Redis accessible on port 6379
- [ ] MinIO API accessible on port 9000
- [ ] MinIO Console accessible on port 9001
- [ ] MinIO buckets created (vehicle-media, content-media)

### Environment & Configuration
- [ ] Root `.env` created with all application variables
- [ ] `.env.example` created for team reference
- [ ] All port variables defined in `.env`
- [ ] No hardcoded values in code

### Database
- [ ] Prisma schema defined with all tables and indexes
- [ ] `nx run prisma:generate` completes successfully
- [ ] Prisma Client generated in node_modules
- [ ] `nx run prisma:migrate` creates initial migration
- [ ] `nx run prisma:seed` populates sample data
- [ ] Database tables verified (via Prisma Studio or psql)
- [ ] Seed data visible in all tables

### Build & Compilation
- [ ] `nx run-many --target=build --all` passes
- [ ] TypeScript compilation passes workspace-wide
- [ ] ESLint passes workspace-wide (`nx run-many --target=lint --all`)
- [ ] No build errors or warnings

### Services - Can Serve as Processes
- [ ] `nx serve fastify-gateway` runs on port 3000
- [ ] `nx serve svc-catalog` runs on port 3001
- [ ] `nx serve svc-content` runs on port 3002
- [ ] `nx serve svc-service-center` runs on port 3003
- [ ] `nx serve svc-garage` runs on port 3004
- [ ] `nx serve web-admin-console` runs on port 4000
- [ ] `nx serve web-mygarage` runs on port 4001
- [ ] `nx serve mobile-mygarage` metro runs on port 8081 (if applicable)

### Health & Connectivity
- [ ] Gateway health endpoint returns 200 OK
- [ ] All backend services have /health endpoints
- [ ] Services can connect to PostgreSQL
- [ ] Services can connect to Redis
- [ ] Services can connect to MinIO
- [ ] Environment variables loaded correctly in all apps

---

## Testing Requirements

**Sanity Tests:**
1. Database connection test from each service
2. MinIO bucket creation and file upload test
3. Redis connection and set/get test
4. Health endpoint for each app returns 200

**Example Health Endpoint (Fastify):**
```typescript
app.get('/health', async (request, reply) => {
  const dbHealth = await prisma.$queryRaw`SELECT 1`;
  const redisHealth = await redis.ping();

  return {
    status: 'ok',
    database: dbHealth ? 'connected' : 'disconnected',
    redis: redisHealth === 'PONG' ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  };
});
```

---

## Dependencies

**Core:**
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)
- MinIO (via Docker)

**Key Packages:**
- @prisma/client 6.19+
- prisma 6.19+
- @nx/* 22+
- typescript 5.9+
- fastify 5+
- zod 4+

---

## Next Steps

After R0 completion:
- **R1 – Admin Console Vertical**: Build Catalog, Content, Service Center services with Admin UI
- All services will use the Prisma schema and shared infrastructure established in R0
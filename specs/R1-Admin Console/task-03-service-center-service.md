# Task 03: Service Center Service - CRUD with Geo-Spatial Support

**Parent Spec:** `spec.md` (R1 - Admin Console)
**Status:** Not Started
**Estimated Effort:** 2-3 days
**Dependencies:** Task 01 (Backend Foundation) complete

---

## References to Main Spec

- **Service Boundaries:** Section 2.1
- **Database Schema:** Section 3.1 (service_center table with PostGIS)
- **API Contracts:** Section 4.2
- **Hex Architecture:** Section 2.2

---

## Objective

Build Service Center microservice with:
1. CRUD operations for service centers
2. PostGIS geo-spatial support for location storage
3. Nearby search functionality (future-ready for R4)
4. Operating hours and services management

---

## Implementation Summary

### Database Schema

```sql
-- Already in main spec Section 3.1
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE service_center (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  geo GEOGRAPHY(Point, 4326),
  operating_hours JSONB,
  services TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### Contracts

**File: `libs/shared/contracts/src/service-center/service-center.ts`**
```typescript
import { z } from 'zod';

export const GeoCoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const OperatingHoursSchema = z.record(
  z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
    close: z.string().regex(/^\d{2}:\d{2}$/),
    closed: z.boolean().default(false),
  })
).optional();

export const CreateServiceCenterSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  geo: GeoCoordinateSchema.optional(),
  operatingHours: OperatingHoursSchema,
  services: z.array(z.string()).default([]),
});

export const UpdateServiceCenterSchema = CreateServiceCenterSchema.partial();

export const ServiceCenterSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('service.center#v1'),
  name: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  geo: GeoCoordinateSchema.optional(),
  operatingHours: OperatingHoursSchema,
  services: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().optional(),
});

export type CreateServiceCenter = z.infer<typeof CreateServiceCenterSchema>;
export type UpdateServiceCenter = z.infer<typeof UpdateServiceCenterSchema>;
export type ServiceCenter = z.infer<typeof ServiceCenterSchema>;
export type GeoCoordinate = z.infer<typeof GeoCoordinateSchema>;
```

### Prisma Schema

**Add to `prisma/schema.prisma`:**
```prisma
model ServiceCenter {
  id              String   @id @default(uuid())
  name            String   @db.VarChar(200)
  address         String   @db.Text
  phone           String?  @db.VarChar(20)
  email           String?  @db.VarChar(100)
  website         String?  @db.VarChar(200)
  // geo stored as string, converted to/from PostGIS format in repository
  geo             String?  @db.Text
  operatingHours  Json?    @map("operating_hours")
  services        String[] @default([])

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  @@index([deletedAt], name: "idx_center_deleted")
  @@map("service_center")
}
```

### Key Implementation Files

Following the same hexagonal pattern as Task 02:

```
apps/motorghar/svc-service-center/
├── src/
│   ├── domain/entities/service-center.entity.ts
│   ├── domain/events/center.events.ts
│   ├── ports/repositories/center.repository.ts
│   ├── adapters/db/center.repository.impl.ts
│   ├── app/use-cases/
│   │   ├── create-center.ts
│   │   ├── list-centers.ts
│   │   ├── get-center.ts
│   │   ├── update-center.ts
│   │   └── delete-center.ts
│   ├── controllers/center.controller.ts
│   ├── config/ (same pattern as Task 02)
│   ├── app.ts
│   └── main.ts
```

### PostGIS Repository Implementation

**File: `apps/motorghar/svc-service-center/src/adapters/db/center.repository.impl.ts`**

Key method for geo handling:
```typescript
import { PrismaClient, Prisma } from '@prisma/client';
import { GeoCoordinate } from '@motorghar/domain';

export class PrismaServiceCenterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(entity: ServiceCenterEntity): Promise<ServiceCenterEntity> {
    const data = entity.toPersistence();

    // Convert geo to PostGIS format using raw SQL
    const geoString = data.geo
      ? `ST_GeogFromText('SRID=4326;POINT(${data.geo.longitude} ${data.geo.latitude})')`
      : null;

    const created = await this.prisma.$executeRawUnsafe(`
      INSERT INTO service_center (
        id, name, address, phone, email, website, geo, operating_hours, services
      ) VALUES (
        '${data.id}', '${data.name}', '${data.address}',
        ${data.phone ? `'${data.phone}'` : 'NULL'},
        ${data.email ? `'${data.email}'` : 'NULL'},
        ${data.website ? `'${data.website}'` : 'NULL'},
        ${geoString || 'NULL'},
        ${data.operatingHours ? `'${JSON.stringify(data.operatingHours)}'::jsonb` : 'NULL'},
        ARRAY[${data.services.map(s => `'${s}'`).join(',')}]::text[]
      )
    `);

    // Then fetch the created record
    return await this.findById(data.id);
  }

  // For reading geo data from PostGIS
  private parseGeoFromDb(geoText: string | null): GeoCoordinate | undefined {
    if (!geoText) return undefined;
    return GeoCoordinate.fromString(geoText);
  }
}
```

**Note:** For R1, we implement basic geo storage. Advanced geo queries (nearby search) will be added in R4.

### API Endpoints

```
POST   /centers              Create service center
GET    /centers              List service centers
GET    /centers/:id          Get service center by ID
PATCH  /centers/:id          Update service center
DELETE /centers/:id          Soft-delete service center
```

### Testing Geo Functionality

**Integration test example:**
```typescript
describe('POST /centers', () => {
  it('should create center with geo coordinates', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/centers',
      payload: {
        name: 'Kathmandu Auto Center',
        address: 'Thamel, Kathmandu',
        phone: '+977-1-4444444',
        geo: {
          latitude: 27.7172,
          longitude: 85.3240,
        },
        services: ['repair', 'maintenance', 'parts'],
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.data.geo).toEqual({
      latitude: 27.7172,
      longitude: 85.3240,
    });
  });
});
```

---

## Acceptance Criteria

- [ ] PostGIS extension enabled in Postgres
- [ ] Service center table created with geography column
- [ ] Service starts on port 3003
- [ ] Can create centers with geo coordinates
- [ ] Can store operating hours as JSONB
- [ ] Can store services as text array
- [ ] All CRUD operations functional
- [ ] Domain events logged to outbox
- [ ] Unit tests pass (80%+ coverage)
- [ ] Integration tests pass
- [ ] Geo coordinates validated (-90 to 90 lat, -180 to 180 lng)

---

## Commands

```bash
# Migration
npx prisma migrate dev --name add_service_center_table

# Build & test
npx nx build svc-service-center
npx nx test svc-service-center

# Start
npx nx serve svc-service-center

# Test API
curl http://localhost:3003/health

curl -X POST http://localhost:3003/centers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nepal Auto Center",
    "address": "Kupandole, Lalitpur",
    "geo": {"latitude": 27.6915, "longitude": 85.3236}
  }'
```

---

## Next Steps

After completion:
1. Commit: `feat(R1): add service center service with geo support`
2. Proceed to Task 04: Content Service
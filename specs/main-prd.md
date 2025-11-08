
# 🧭 **MotorGhar V1 – Unified Product Requirements Document (PRD v1.0)**

**Architecture:** Scalable Hexagonal, Type-centric, API-first, Event-ready
**Codebase Layout:** Nx Monorepo (`apps/motorghar/*`, `packages/*`)
**Goal:** Ship a stable, testable, incrementally extensible foundation for the MotorGhar ecosystem.

---

## 1. Vision

MotorGhar aims to be a **digital garage + automotive information platform**, enabling users to manage their vehicles, track maintenance, view recalls and news, and connect to nearby service centers.
It also provides an **Admin Console** for managing all catalog, service, and content data.

---

## 2. Guiding Principles

| Principle                    | Description                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Hexagonal Architecture**   | Each service isolates its domain. Adapters connect via ports.                                         |
| **Type-centric Development** | Shared typed entities and Zod schemas define a single source of truth.                                |
| **API-first**                | All services expose REST APIs derived from Zod contracts and auto-generate OpenAPI specs.             |
| **Testability**              | Every use-case is unit-testable; repositories and adapters are mockable.                              |
| **Event-driven future**      | Outbox events prepared now for future Kafka/NATS integration.                                         |
| **Monorepo Discipline**      | Shared libs contain no business logic. Apps and services are project-scoped under `apps/motorghar/*`. |

---

## 3. Implementation Phases (Ordered)

| Phase                              | Description                                                       | Deliverables                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **R0 – Foundation**                | Setup monorepo, infra (Docker), database (Prisma), shared libs    | Docker compose, Prisma schema + migrations, all apps building/serving, env configs, port allocation    |
| **R1 – Admin Console Vertical**    | CRUD for catalog, service centers, content, and review moderation | Admin web app + Fastify gateway + backend services                                                     |
| **R2 – Garage Service**            | Vehicle onboarding CRUD for end users                             | Garage microservice + gateway integration                                                              |
| **R3 – My Garage (Web)**           | User portal for managing vehicles                                 | Next.js frontend consuming catalog, garage, and content APIs                                           |
| **R4 – Service Appointments**      | Search nearby centers, create appointments, export to calendar    | Service center backend + geo search                                                                    |
| **R5 – Mobile (Expo)**             | Native-like experience: camera upload, push, offline sync         | Expo app sharing contracts and API clients                                                             |
| **R6 – Event Bus & Notifications** | Wire outbox to Kafka/NATS, add user notifications                 | Notification service + subscription infra                                                              |

---

## 4. Monorepo Layout (Finalized)

```
apps/
  motorghar/
    fastify-gateway/            # API Gateway (routing, auth, telemetry)
    svc-catalog/                # Vehicle catalog + variants
    svc-content/                # News, events, videos, recalls
    svc-service-center/         # Centers + appointments + geo search
    svc-garage/                 # My Garage service (user vehicles, notes, reviews)
    web-admin-console/          # Admin UI (Next.js)
    web-mygarage/               # User web app (Next.js)
    mobile-mygarage/            # Mobile app (Expo React Native)
libs/
  shared/                       # Platform-agnostic libraries (reusable across products)
    contracts/                  # Global Zod schemas, OpenAPI generator
    types/                      # Typed IDs, DTOs, enums, helpers
    config/                     # ESLint, TS, Jest, Vitest configs
    testing/                    # Test harness, factories, mocks
    ui/                         # Cross-product UI component system (React/React Native)
  motorghar/                    # MotorGhar-specific domain libraries
    domain/                     # Aggregates, entities, value objects shared across MotorGhar services
    adapters/                   # Shared adapters (e.g., MinIO, Prisma base repo, Outbox writer)
    services/                   # Internal MotorGhar service SDKs or API clients
    constants/                  # Domain constants (event names, entity types, prefixes)
infra/
  docker-compose.yml            # Postgres, Redis, MinIO, (PostGIS)
  migrations/                   # Per-service or global DB migrations
  seed/                         # Seed scripts for demo and testing

```

**Rules**

* All `apps/motorghar/*` are product-specific.
* Shared packages never import from `apps/`.
* Each service is hexagonal: `controllers → app/use-cases → domain → ports → adapters`.

---

## 5. Core Services Overview

| Service                          | Responsibility                                      | Entities                                                                             |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Catalog Service**              | Manage vehicle catalog & variants                   | `vehicle_catalog`, `vehicle_variant`                                                 |
| **Garage Service**               | User-owned vehicles, notes, gallery, reviews        | `owner_vehicle`, `owner_vehicle_note`, `owner_vehicle_media`, `owner_vehicle_review` |
| **Service Center Service**       | Manage and expose centers & appointments            | `service_center`, `service_appointment`                                              |
| **Content Service**              | News, events, videos, recalls                       | `content_post` (type-based)                                                          |
| **Notification Service (later)** | Subscriptions, recall alerts, appointment reminders | `notification_event`, `user_notification`                                            |

---

## 6. Data Model (Unified)

| Table                  | Purpose                       | Key Columns                                                                     |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| `vehicle_catalog`      | Master list of vehicles       | id, make, model, year, trim, specs_jsonb, media[], created_at, updated_at       |
| `vehicle_variant`      | Linked variants               | id, catalog_id, name, specs_jsonb                                               |
| `owner_vehicle`        | User’s garage vehicle         | id, user_id, catalog_id, nickname, odo_km, fields_jsonb, created_at, deleted_at |
| `owner_vehicle_note`   | Text notes                    | id, owner_vehicle_id, body, timestamps                                          |
| `owner_vehicle_media`  | Images/videos                 | id, owner_vehicle_id, url, kind                                                 |
| `owner_vehicle_review` | Ratings/comments              | id, owner_vehicle_id, rating, comment, approved                                 |
| `service_center`       | Workshops                     | id, name, address, phone, geo geography(Point,4326)                             |
| `service_appointment`  | Booked slots                  | id, owner_vehicle_id, center_id, slot_ts, status                                |
| `content_post`         | News, events, videos, recalls | id, type, title, body_md, vehicle_ids[], status, publish_at                     |
| `domain_outbox`        | Domain events                 | id, aggregate_type, aggregate_id, event_type, payload_jsonb                     |

---

## 7. Functional Requirements

### 7.1 Admin Console

| Area                   | Requirement                                                 |
| ---------------------- | ----------------------------------------------------------- |
| **Catalog Management** | Full CRUD on `vehicle_catalog`, upload media, soft delete.  |
| **Service Centers**    | CRUD + geo coordinates.                                     |
| **Content Posts**      | CRUD on news/events/videos/recalls; draft/published states. |
| **Review Moderation**  | View and toggle approval.                                   |
| **Auth**               | JWT stub for now, `admin` role; later Keycloak realm.       |

### 7.2 My Garage (User Portal)

| Area                | Requirement                                    |
| ------------------- | ---------------------------------------------- |
| **Vehicle Search**  | Query catalog by make, model, year.            |
| **Onboard Vehicle** | Add to garage (CRUD).                          |
| **Notes & Media**   | Add text notes, upload images/videos.          |
| **Reviews**         | Add/edit reviews for owned vehicles.           |
| **Vehicle Feed**    | Show related content posts.                    |
| **Service Centers** | Search nearby, view details, book appointment. |

### 7.3 Service Appointments

| Area                | Requirement                                |
| ------------------- | ------------------------------------------ |
| **Geo Search**      | `GET /centers/nearby?lat=&lng=&radius_km=` |
| **Appointments**    | Book, view, cancel.                        |
| **Calendar Export** | `.ics` file download.                      |

### 7.4 Notifications (Future)

| Area                      | Requirement                           |
| ------------------------- | ------------------------------------- |
| **Domain Event Handling** | Outbox → Kafka topic emission.        |
| **User Subscriptions**    | Per-vehicle recall and event updates. |

---

## 8. API Endpoints Summary (V1)

| Service            | Endpoints (subset)                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Catalog**        | `POST /v1/catalog/vehicles`, `GET /v1/catalog/vehicles`, `PATCH /v1/catalog/vehicles/{id}`, `DELETE /v1/catalog/vehicles/{id}`                       |
| **Garage**         | `POST /v1/garage/vehicles`, `GET /v1/garage/vehicles`, `PATCH /v1/garage/vehicles/{id}`, `POST /v1/garage/vehicles/{id}/notes`, `/media`, `/reviews` |
| **Service Center** | `POST /v1/centers`, `GET /v1/centers/nearby`, `POST /v1/appointments`, `GET /v1/appointments/{id}`, `/ics`                                           |
| **Content**        | `POST /v1/content/posts`, `GET /v1/content/posts`, `GET /v1/content/posts/{id}`                                                                      |
| **Gateway**        | Unified entrypoint; routes + auth + metrics.                                                                                                         |

---

## 9. Vertical Slice Plan

| Slice                       | Description                      | Test Focus                    |
| --------------------------- | -------------------------------- | ----------------------------- |
| **Slice 1 (Admin)**         | Catalog + Centers + Content CRUD | Full e2e: Admin UI → API → DB |
| **Slice 2 (Garage)**        | Add vehicle to My Garage         | Use-case + outbox event       |
| **Slice 3 (Appointments)**  | Schedule appointment             | Geo + time validation         |
| **Slice 4 (Notifications)** | Publish `AppointmentCreated#v1`  | Event → consumer verification |
| **Slice 5 (User Frontend)** | End-to-end flow                  | Browser + mobile parity       |

---

## 10. Example Contracts (Zod, Shared)

```ts
// packages/contracts/src/catalog.ts
export const VehicleCatalogReq = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().int().gte(1900),
  trim: z.string().optional(),
  fuel_type: z.string().optional(),
  specs: z.record(z.string(), z.any()).default({}),
  media: z.array(z.string()).default([])
});

export const VehicleCatalogRes = VehicleCatalogReq.extend({
  id: z.string(),
  type: z.literal("vehicle.catalog#v1"),
  createdAt: z.string()
});
```

---

## 11. Hexagonal Layout per Service

```
/src
  /controllers   # HTTP handlers, zod validation
  /app           # Use-cases (business workflows)
  /domain        # Entities, value objects, events
  /ports         # Interfaces (Repo, EventBus, ExternalSvc)
  /adapters
     /db         # Prisma/Postgres adapters
     /storage    # MinIO
     /events     # Outbox writer
  index.ts
/tests
  /unit
  /integration
```

---

## 12. Example Use-case and Test

```ts
export class AddOwnerVehicle {
  constructor(
    private catalog: CatalogQuery,
    private repo: OwnerVehicleRepo,
    private outbox: DomainOutbox
  ) {}

  async execute(input: AddOwnerVehicleInput) {
    const vehicle = await this.catalog.getById(input.catalogId);
    if (!vehicle) throw new NotFoundError("Catalog entry not found");
    const entity = OwnerVehicle.create(input);
    const saved = await this.repo.create(entity);
    await this.outbox.append({
      aggregateType: "vehicle.owner#v1",
      aggregateId: saved.id,
      eventType: "VehicleOwnerAdded#v1",
      payload: { ...input, id: saved.id }
    });
    return saved;
  }
}
```

**Unit Test**

```ts
it('creates owner vehicle and emits event', async () => {
  const uc = new AddOwnerVehicle(mockCatalog, mockRepo, mockOutbox);
  const res = await uc.execute({ userId:'u1', catalogId:'c1' });
  expect(res.catalogId).toBe('c1');
  expect(mockOutbox.append).toHaveBeenCalled();
});
```

---

## 13. Frontend Strategy

### 13.1 Web Admin Console (`apps/motorghar/web-admin-console`)

* Stack: Next.js (App Router), React Query, Tailwind, ShadCN UI.
* Modules: Catalog, Centers, Content, Reviews, Auth.
* API client: Auto-generated from contracts (Zod + OpenAPI).

### 13.2 My Garage Web (`apps/motorghar/web-mygarage`)

* Stack: Next.js, same design system.
* Modules: Garage list, add/edit vehicle, view feeds, appointments.

### 13.3 Mobile (`apps/motorghar/mobile-mygarage`)

* Stack: Expo React Native.
* Shares contracts and API client.
* Adds camera, push notifications, offline store (SQLite/MMKV).

---

## 14. Testing Strategy (Unified)

| Level           | Tool       | Scope                     |
| --------------- | ---------- | ------------------------- |
| **Unit**        | Jest       | Domain + use-cases        |
| **Integration** | Supertest  | API + DB adapters         |
| **Contract**    | Pact       | Gateway ↔ service schemas |
| **E2E**         | Playwright | Admin & User flows        |
| **Smoke**       | k6/Postman | API health pre-deploy     |

---

## 15. Observability & CI/CD

| Aspect               | Tool/Approach                                            |
| -------------------- | -------------------------------------------------------- |
| **Logging**          | Pino with correlation IDs                                |
| **Tracing**          | OpenTelemetry + Jaeger                                   |
| **Metrics**          | Prometheus endpoint per service                          |
| **CI/CD**            | GitHub/GitLab CI: lint → test → build → migrate → deploy |
| **Migrations**       | Prisma migrate or sqitch per service                     |
| **Dockerized Infra** | `docker-compose up` spins DB + MinIO + Redis             |

---

## 16. Definition of Done (Per Vertical)

✅ Zod contracts + OpenAPI generated
✅ Unit/integration/e2e tests pass
✅ Outbox events logged for domain changes
✅ CI pipeline green
✅ API and frontend deployed to staging
✅ Seed data auto-provisioned
✅ Smoke tests (create → read → update → delete) verified

---

## 17. Long-term Extensibility (beyond V1)

* Add Recall data ingestion from OEM feeds.
* Introduce AI-based maintenance recommendations.
* Add offline support + background sync to mobile.
* Introduce personalized notification subscriptions.
* Integrate payment or booking confirmation workflows.

---

## 18. Golden Path (Combined E2E)

**Scenario:** Admin adds a new vehicle → User adds it to Garage → Books service → Gets recall notification.

```gherkin
Feature: End-to-End MotorGhar Flow
  Scenario: Full lifecycle
    Given admin "a1" creates catalog vehicle "Honda CBR250R"
    When user "u1" searches catalog and adds it to garage
      And user "u1" books an appointment at "BikersNepal Center"
    Then outbox logs events:
      | CatalogVehicleCreated#v1 |
      | VehicleOwnerAdded#v1 |
      | AppointmentCreated#v1 |
    And user feed shows news and events for that vehicle
```

---

## 19. Summary – What Ships in V1

| Category            | Deliverable                                        |
| ------------------- | -------------------------------------------------- |
| **Backend**         | Fastify gateway + 4 domain services + outbox infra |
| **Frontend**        | Admin Console (Next.js) + MyGarage Web             |
| **Database**        | Postgres + PostGIS + MinIO + Redis                 |
| **Shared Packages** | contracts, types, testing, config, ui              |
| **Testing**         | Jest + Playwright + contract validation            |
| **CI/CD**           | Automated build/test/deploy pipelines              |
| **Foundation**      | Fully typed, modular, and event-ready architecture |


## 20. Port Allocation & Development Strategy

### Infrastructure Services (Docker)
| Service    | Port  | Access URL            | Purpose           |
|------------|-------|-----------------------|-------------------|
| PostgreSQL | 5432  | localhost:5432        | Database          |
| Redis      | 6379  | localhost:6379        | Cache/Sessions    |
| MinIO API  | 9000  | localhost:9000        | Object Storage    |
| MinIO UI   | 9001  | http://localhost:9001 | Storage Console   |
| pgAdmin    | 5050  | http://localhost:5050 | DB Management     |

### Application Services (Local Processes - Development)
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

**Note:** All ports must be configurable via environment variables (PORT_GATEWAY, PORT_SVC_CATALOG, etc.)

### Development vs Production Strategy

**Development (All Phases):**
- Infrastructure runs in Docker (Postgres, Redis, MinIO)
- Applications run as local Node.js processes via `nx serve <app>`
- Faster iteration, easier debugging, native tooling support
- Each service connects to Dockerized infrastructure

**Production (Future):**
- All services containerized
- `docker-compose.services.yml` for full stack
- Kubernetes/container orchestration ready

---

## 21. Universal Guidelines
* 1. Develop in small increments while fully keeping the product owner in sync. They will run all commands needed to setup, build and test the system.
* 2. Follow SOLID design principles at implementation time.
* 3. Every unit of work should be followed by unit test run and everything should pass before we move to the next step.
* 4. Integeration should be run at every logical milestone that requires integration testing.
* 5. No regression at any time, always reference the phase specific PRD or the main PRD for guidance.
* 6. No hardcoding of values at all. If any configuration change requires code to be modified, that is an anti-pattern.
* 7. Separate all configurations into environment variables or other declarative configuration options.
* 8. All external services run via docker.
* 9. Each phase must have: `spec.md` (detailed specification), `todo.md` (task checklist), and `quick-start-guide.md` (step-by-step setup).
* 10. Environment configuration split: `infra/.env` for Docker services, root `.env` for applications.




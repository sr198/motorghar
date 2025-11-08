# R0 Foundation - Task List

## Phase Status: ✅ Complete

---

## 1. Infrastructure Setup

- [x] Create `infra/.env` for Docker Compose
  - [x] PostgreSQL configuration (user, password, db, port)
  - [x] Redis configuration (port, password)
  - [x] MinIO configuration (root user, password, ports)
  - [x] pgAdmin configuration (email, password, port)

- [x] Create `infra/docker-compose.yml` with all services
  - [x] PostgreSQL 16 with PostGIS extension
  - [x] Redis 7 with persistence
  - [x] MinIO with console access
  - [x] Configure networks and volumes
  - [x] Add health checks for all services
  - [x] Reference `infra/.env` for configuration

- [x] Create application environment configuration
  - [x] Root `.env.example` template with all variables
  - [x] Root `.env` with actual values (git-ignored)
  - [x] Add DATABASE_URL
  - [x] Add REDIS_URL
  - [x] Add MinIO configuration
  - [x] Add all PORT_* variables for services
  - [x] Add NODE_ENV and LOG_LEVEL
  - [x] Add JWT_SECRET and JWT_EXPIRES_IN
  - [x] Document all environment variables

- [x] Start and verify Docker infrastructure
  - [x] `docker-compose up -d`
  - [x] Verify PostgreSQL connection (port 5432)
  - [x] Verify Redis connection (port 6379)
  - [x] Verify MinIO API access (port 9000)
  - [x] Verify MinIO console access (port 9001)
  - [x] Create MinIO buckets (vehicle-media, content-media)

---

## 2. Prisma Setup

- [x] Create `prisma/schema.prisma`
  - [x] Configure datasource (PostgreSQL)
  - [x] Configure generator (@prisma/client)
  - [x] Define DomainOutbox model
  - [x] Define VehicleCatalog model
  - [x] Define VehicleCatalogMedia model
  - [x] Define OwnerVehicle model
  - [x] Define OwnerVehicleNote model
  - [x] Define OwnerVehicleMedia model
  - [x] Define OwnerVehicleReview model
  - [x] Define ServiceCenter model
  - [x] Define ServiceAppointment model
  - [x] Define ContentPost model
  - [x] Add all indexes

- [x] Configure Nx Prisma targets
  - [x] Add `prisma:generate` target
  - [x] Add `prisma:migrate` target
  - [x] Add `prisma:migrate:deploy` target
  - [x] Add `prisma:seed` target
  - [x] Add `prisma:studio` target

- [x] Create seed script
  - [x] `prisma/seed.ts` file
  - [x] Seed vehicle catalog data (3-5 vehicles)
  - [x] Seed service centers (2-3 centers)
  - [x] Seed content posts (2-3 posts)
  - [x] Configure seed in `package.json`

- [x] Run Prisma operations
  - [x] `nx run prisma:generate`
  - [x] `nx run prisma:migrate` (create initial migration)
  - [x] `nx run prisma:seed`
  - [x] Verify tables in database (Prisma Studio or psql)

---

## 3. Shared Libraries Setup

- [x] Configure `libs/shared/contracts`
  - [x] Setup package.json
  - [x] Add Zod dependency
  - [x] Create basic contract structure
  - [x] Verify it builds

- [x] Configure `libs/shared/types`
  - [x] Setup package.json
  - [x] Create branded ID types
  - [x] Create common enums
  - [x] Verify it builds

- [x] Configure `libs/shared/config`
  - [x] ESLint configuration
  - [x] TypeScript base config
  - [x] Jest preset
  - [x] Prettier config

- [x] Configure `libs/shared/testing`
  - [x] Setup package.json
  - [x] Create test helpers
  - [x] Create mock factories
  - [x] Verify it builds

- [x] Configure `libs/shared/ui`
  - [x] Setup package.json
  - [x] Create basic component structure
  - [x] Verify it builds

---

## 4. MotorGhar Libraries Setup

- [x] Configure `libs/motorghar/domain`
  - [x] Setup package.json
  - [x] Create entity base classes
  - [x] Create value object examples
  - [x] Verify it builds

- [x] Configure `libs/motorghar/adapters`
  - [x] Setup package.json
  - [x] Create Prisma base repository
  - [x] Create Prisma client singleton
  - [x] Create Redis client singleton
  - [x] Create MinIO adapter stub
  - [x] Create Outbox writer
  - [x] Verify it builds

- [x] Configure `libs/motorghar/services`
  - [x] Setup package.json
  - [x] Create service client structure
  - [x] Verify it builds

- [x] Configure `libs/motorghar/constants`
  - [x] Setup package.json
  - [x] Define event names
  - [x] Define entity type constants
  - [x] Define ID prefixes
  - [x] Verify it builds

---

## 5. Application Setup

- [x] Configure `apps/motorghar/fastify-gateway` (Port 3000)
  - [x] Verify project.json configuration
  - [x] Configure port from PORT_GATEWAY env var
  - [x] Add basic health endpoint
  - [x] Add Prisma client connection
  - [x] Add Redis connection
  - [x] Test build: `nx build fastify-gateway`
  - [x] Test run: `nx serve fastify-gateway` (verify on port 3000)

- [x] Configure `apps/motorghar/svc-catalog` (Port 3001)
  - [x] Verify project.json configuration
  - [x] Configure port from PORT_SVC_CATALOG env var
  - [x] Add health endpoint
  - [x] Add Prisma database connection
  - [x] Test build and run on port 3001

- [x] Configure `apps/motorghar/svc-content` (Port 3002)
  - [x] Verify project.json configuration
  - [x] Configure port from PORT_SVC_CONTENT env var
  - [x] Add health endpoint
  - [x] Add Prisma database connection
  - [x] Test build and run on port 3002

- [x] Configure `apps/motorghar/svc-service-center` (Port 3003)
  - [x] Verify project.json configuration
  - [x] Configure port from PORT_SVC_SERVICE_CENTER env var
  - [x] Add health endpoint
  - [x] Add Prisma database connection
  - [x] Test build and run on port 3003

- [x] Configure `apps/motorghar/svc-garage` (Port 3004)
  - [x] Verify project.json configuration
  - [x] Configure port from PORT_SVC_GARAGE env var
  - [x] Add health endpoint
  - [x] Add Prisma database connection
  - [x] Test build and run on port 3004

- [x] Configure `apps/motorghar/web-admin-console` (Port 4000)
  - [x] Verify project.json configuration
  - [x] Configure port from PORT_WEB_ADMIN env var
  - [x] Add basic Next.js page
  - [x] Test build and run on port 4000

- [x] Configure `apps/motorghar/web-mygarage` (Port 4001)
  - [x] Verify project.json configuration
  - [x] Configure port from PORT_WEB_MYGARAGE env var
  - [x] Add basic Next.js page
  - [x] Test build and run on port 4001

- [x] Configure `apps/motorghar/mobile-mygarage` (Metro Port 8081)
  - [x] Verify project.json configuration
  - [x] Configure Metro bundler port from PORT_MOBILE_METRO env var
  - [x] Add basic React Native screen
  - [x] Test build (if possible in dev environment)

---

## 6. Integration & Verification

- [x] Build all workspace packages
  - [x] `nx run-many --target=build --all`
  - [x] Verify no TypeScript errors
  - [x] Verify no build errors

- [x] Run workspace linting
  - [x] `nx run-many --target=lint --all`
  - [x] Fix any linting errors

- [x] Test database connections
  - [x] Each backend service can connect to PostgreSQL
  - [x] Verify Prisma Client is generated and accessible
  - [x] Test basic CRUD operation from one service

- [x] Test Redis connections
  - [x] Services can connect to Redis
  - [x] Test basic set/get operations

- [ ] Test MinIO integration
  - [ ] Services can connect to MinIO
  - [ ] Test bucket creation
  - [ ] Test file upload/download

- [x] Verify environment configuration
  - [x] All services load .env correctly
  - [x] No hardcoded values in code
  - [x] Configuration documented

---

## 7. Documentation & Cleanup

- [x] Update README.md
  - [x] Quick start instructions
  - [x] Docker setup steps
  - [x] Prisma commands
  - [x] Build and run commands

- [x] Create DEVELOPMENT.md
  - [x] Local development setup
  - [x] Architecture overview
  - [x] Common commands reference

- [x] Verify .gitignore
  - [x] .env excluded
  - [x] node_modules excluded
  - [x] Build artifacts excluded
  - [x] Prisma migrations included

- [x] Clean up any unused code
  - [x] Remove scaffold boilerplate
  - [x] Remove unused dependencies

---

## Acceptance Criteria

 All items above completed
 `docker-compose up -d` starts all infrastructure
 `nx run prisma:migrate` creates all tables
 `nx run prisma:seed` populates sample data
 `nx run-many --target=build --all` passes
 Each app can start individually
 Health endpoints return 200 OK
 Database accessible with seed data
 No TypeScript/ESLint errors
 Documentation complete

---

**Ready for R1:** Once all tasks complete, foundation is ready for R1  Admin Console development.

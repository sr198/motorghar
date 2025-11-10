# R1 - Admin Console: Development Checklist

**Version:** 1.0
**Status:** Planning Complete
**Last Updated:** 2025-11-09

---

## Overview

This checklist tracks the implementation progress of R1 - Admin Console. Each task must be completed sequentially, with all acceptance criteria met before proceeding to the next task.

**Reference:** See `spec.md` for high-level architecture and individual `task-*.md` files for detailed implementation guides.

---

## Task 01: Backend Foundation  Pending

**Spec:** `task-01-backend-foundation.md`
**Estimated:** 2-3 days
**Dependencies:** R0 Foundation complete

### Subtasks

#### Shared Libraries
- [ ] Create `libs/shared/contracts` package
  - [ ] Common response schemas
  - [ ] Pagination schemas
  - [ ] Auth schemas (login, JWT)
  - [ ] Build and lint pass
- [ ] Create `libs/shared/types` package
  - [ ] Branded ID types
  - [ ] Enums (ContentPostType, etc.)
  - [ ] Build and lint pass
- [ ] Create `libs/motorghar/domain` package
  - [ ] Base Entity class
  - [ ] DomainEvent interface
  - [ ] GeoCoordinate value object
  - [ ] Unit tests pass
- [ ] Create `libs/motorghar/adapters` package
  - [ ] DomainOutboxWriter implementation
  - [ ] Build and lint pass

#### Fastify Gateway
- [ ] Create gateway application structure
- [ ] Environment configuration with Zod validation
- [ ] JWT utilities (sign, verify, extract)
- [ ] Response formatter utilities
- [ ] Plugins:
  - [ ] CORS plugin
  - [ ] Request logger with correlation IDs
  - [ ] Error handler (Zod, JWT, service errors)
  - [ ] Auth middleware (JWT validation)
- [ ] Routes:
  - [ ] Auth routes (POST /v1/auth/login, GET /v1/auth/me)
  - [ ] Proxy routes (catalog, content, centers, reviews)
- [ ] Health check endpoint
- [ ] Application bootstrap

#### Testing
- [ ] Unit tests for JWT utilities
- [ ] Unit tests for GeoCoordinate
- [ ] Integration tests for auth routes
- [ ] All tests passing

#### Validation
- [ ] Gateway starts on port 3000
- [ ] Login returns valid JWT
- [ ] Protected routes require auth
- [ ] Invalid tokens return 401
- [ ] All packages build without errors
- [ ] ESLint passes

**Commit:** `feat(R1): backend foundation with gateway and auth stub`

---

## Task 02: Catalog Service  Pending

**Spec:** `task-02-catalog-service.md`
**Estimated:** 3-4 days
**Dependencies:** Task 01 complete

### Subtasks

#### Database & Contracts
- [ ] Prisma schema for `vehicle_catalog` and `vehicle_variant`
- [ ] Run migration: `add_vehicle_catalog_tables`
- [ ] Contracts for catalog CRUD (request/response schemas)
- [ ] Contracts for variants
- [ ] Update contracts index exports

#### Service Implementation
- [ ] Create `svc-catalog` application
- [ ] Configuration (env, ports, MinIO)
- [ ] Domain layer:
  - [ ] CatalogEntity with business logic
  - [ ] VariantEntity
  - [ ] Catalog events (CREATED, UPDATED, DELETED, MEDIA_ADDED)
- [ ] Ports:
  - [ ] CatalogRepository interface
  - [ ] VariantRepository interface
  - [ ] MediaStoragePort interface
- [ ] Adapters:
  - [ ] PrismaCatalogRepository
  - [ ] PrismaVariantRepository
  - [ ] MinioStorageAdapter (with bucket creation)
- [ ] Use cases:
  - [ ] CreateCatalogUseCase
  - [ ] ListCatalogUseCase
  - [ ] GetCatalogUseCase
  - [ ] UpdateCatalogUseCase
  - [ ] DeleteCatalogUseCase (soft delete)
  - [ ] UploadMediaUseCase
- [ ] Controllers:
  - [ ] Catalog controller (all CRUD + media upload)
  - [ ] Variant controller
- [ ] Application bootstrap with DI container

#### Testing
- [ ] Unit tests for entities
- [ ] Unit tests for use cases
- [ ] Integration tests for all endpoints
- [ ] Media upload test
- [ ] Outbox event verification tests
- [ ] All tests passing (80%+ coverage)

#### Validation
- [ ] Service starts on port 3001
- [ ] Can create, list, get, update, delete catalog entries
- [ ] Can upload media to MinIO
- [ ] Media URLs stored in database
- [ ] Domain events in outbox table
- [ ] Zod validation working

**Commit:** `feat(R1): add catalog service with CRUD and media upload`

---

## Task 03: Service Center Service  Pending

**Spec:** `task-03-service-center-service.md`
**Estimated:** 2-3 days
**Dependencies:** Task 01 complete

### Subtasks

#### Database & Contracts
- [ ] Enable PostGIS extension in Postgres
- [ ] Prisma schema for `service_center` with geo column
- [ ] Run migration: `add_service_center_table`
- [ ] Contracts for service center CRUD
- [ ] GeoCoordinate schema in contracts

#### Service Implementation
- [ ] Create `svc-service-center` application
- [ ] Configuration
- [ ] Domain layer:
  - [ ] ServiceCenterEntity
  - [ ] Center events
- [ ] Ports:
  - [ ] ServiceCenterRepository interface
- [ ] Adapters:
  - [ ] PrismaServiceCenterRepository (with PostGIS handling)
- [ ] Use cases:
  - [ ] CreateCenterUseCase
  - [ ] ListCentersUseCase
  - [ ] GetCenterUseCase
  - [ ] UpdateCenterUseCase
  - [ ] DeleteCenterUseCase (soft delete)
- [ ] Controllers:
  - [ ] Center controller
- [ ] Application bootstrap

#### Testing
- [ ] Unit tests for entities
- [ ] Unit tests for use cases
- [ ] Integration tests (including geo coordinate storage)
- [ ] PostGIS POINT format verification
- [ ] All tests passing

#### Validation
- [ ] Service starts on port 3003
- [ ] Can CRUD service centers
- [ ] Geo coordinates stored as PostGIS POINT
- [ ] Operating hours stored as JSONB
- [ ] Services stored as text array

**Commit:** `feat(R1): add service center service with geo support`

---

## Task 04: Content Service  Pending

**Spec:** `task-04-content-service.md`
**Estimated:** 2-3 days
**Dependencies:** Task 01 complete

### Subtasks

#### Database & Contracts
- [ ] Prisma schema for `content_post` with enums
- [ ] Run migration: `add_content_post_table`
- [ ] Contracts for content CRUD
- [ ] ContentPostType and Status enums in contracts

#### Service Implementation
- [ ] Create `svc-content` application
- [ ] Configuration
- [ ] Slug generation utility
- [ ] Domain layer:
  - [ ] ContentPostEntity with publishing logic
  - [ ] Content events
- [ ] Ports:
  - [ ] ContentPostRepository interface
- [ ] Adapters:
  - [ ] PrismaContentPostRepository
- [ ] Use cases:
  - [ ] CreatePostUseCase (with slug generation)
  - [ ] ListPostsUseCase (filter by type, status, vehicle)
  - [ ] GetPostUseCase
  - [ ] GetPostBySlugUseCase
  - [ ] UpdatePostUseCase
  - [ ] DeletePostUseCase
  - [ ] PublishPostUseCase
  - [ ] ArchivePostUseCase
- [ ] Controllers:
  - [ ] Content controller
- [ ] Application bootstrap

#### Testing
- [ ] Unit tests for slug generation
- [ ] Unit tests for entities (publish/archive/draft)
- [ ] Unit tests for use cases
- [ ] Integration tests for all endpoints
- [ ] Publishing workflow tests
- [ ] All tests passing

#### Validation
- [ ] Service starts on port 3002
- [ ] Can create all 4 content types (news, event, video, recall)
- [ ] Slugs auto-generated and unique
- [ ] Can filter by type, status, vehicleId
- [ ] Publish/archive/draft workflow works
- [ ] Scheduled publishing respected

**Commit:** `feat(R1): add content service with multi-type posts`

---

## Task 05: Review Moderation (Garage Service)  Pending

**Spec:** `task-05-review-moderation.md`
**Estimated:** 1-2 days
**Dependencies:** Task 01 complete

### Subtasks

#### Database & Contracts
- [ ] Prisma schema for `owner_vehicle_review`
- [ ] Run migration: `add_owner_vehicle_review_table`
- [ ] Contracts for review queries and approval
- [ ] README noting full garage features in R2

#### Service Implementation
- [ ] Create `svc-garage` application (minimal for R1)
- [ ] Configuration
- [ ] Domain layer:
  - [ ] OwnerVehicleReviewEntity
  - [ ] Review events (APPROVED, REJECTED)
- [ ] Ports:
  - [ ] ReviewRepository interface
- [ ] Adapters:
  - [ ] PrismaReviewRepository
- [ ] Use cases:
  - [ ] ListReviewsUseCase (filter by approved)
  - [ ] GetReviewUseCase
  - [ ] ModerateReviewUseCase (approve/reject)
- [ ] Controllers:
  - [ ] Review controller
- [ ] Application bootstrap

#### Testing
- [ ] Unit tests for entities
- [ ] Unit tests for moderation use case
- [ ] Integration tests for review endpoints
- [ ] All tests passing

#### Seed Data
- [ ] Create seed data with sample reviews for testing

#### Validation
- [ ] Service starts on port 3004
- [ ] Can list reviews
- [ ] Can filter by approved/pending
- [ ] Can approve/reject reviews
- [ ] Domain events logged for approval/rejection

**Commit:** `feat(R1): add garage service with review moderation`

---

## Task 06: Admin Console Frontend  Pending

**Spec:** `task-06-admin-console-frontend.md`
**Estimated:** 4-5 days
**Dependencies:** Tasks 01-05 complete

### Subtasks

#### Setup
- [ ] Create Next.js application `web-admin-console`
- [ ] Configure Tailwind CSS
- [ ] Install dependencies (React Query, React Hook Form, Zod, etc.)
- [ ] Setup environment variables (.env.local)

#### Core Infrastructure
- [ ] API client with axios (auth interceptor)
- [ ] Auth context and provider
- [ ] Token management utilities
- [ ] React Query provider
- [ ] Toast notifications (sonner)

#### API Layer
- [ ] Auth API methods (login, me)
- [ ] Catalog API methods
- [ ] Service center API methods
- [ ] Content API methods
- [ ] Review API methods
- [ ] React Query hooks for all entities

#### Layout & Navigation
- [ ] Root layout with providers
- [ ] Protected route layout
- [ ] Sidebar navigation
- [ ] Header component
- [ ] Login page

#### Pages - Catalog
- [ ] Catalog list page (with search/filter)
- [ ] Catalog create page with form
- [ ] Catalog edit page
- [ ] Media uploader component
- [ ] Validation with React Hook Form + Zod

#### Pages - Service Centers
- [ ] Center list page
- [ ] Center create/edit page
- [ ] Map picker component (Leaflet)
- [ ] Operating hours form

#### Pages - Content
- [ ] Content list page (filter by type/status)
- [ ] Content create/edit page
- [ ] Markdown editor
- [ ] Type selector
- [ ] Status workflow buttons (publish/archive)

#### Pages - Reviews
- [ ] Review list page (filter by approved)
- [ ] Review card component
- [ ] Approve/reject buttons

#### Pages - Dashboard
- [ ] Dashboard with stats
- [ ] Recent activity widgets

#### Testing (Manual)
- [ ] Login/logout flow
- [ ] All CRUD operations per entity
- [ ] Form validation
- [ ] Error handling
- [ ] Loading states

#### Validation
- [ ] App runs on port 4000
- [ ] Login with admin credentials works
- [ ] All CRUD flows functional
- [ ] Responsive design (desktop + tablet)
- [ ] Toast notifications on success/error
- [ ] Protected routes redirect to login

**Commit:** `feat(R1): add admin console frontend with all CRUD interfaces`

---

## Task 07: Integration & E2E Testing  Pending

**Spec:** `task-07-integration-testing.md`
**Estimated:** 2-3 days
**Dependencies:** Tasks 01-06 complete

### Subtasks

#### Test Infrastructure
- [ ] Create `libs/shared/testing` package
- [ ] TestServer utility (database reset, cleanup)
- [ ] Test factories (catalog, center, content)
- [ ] Playwright setup for E2E tests

#### Integration Tests
- [ ] Catalog service integration tests (full CRUD + media)
- [ ] Service center integration tests (full CRUD + geo)
- [ ] Content service integration tests (full CRUD + publishing)
- [ ] Review service integration tests (list + moderation)
- [ ] Gateway integration tests (routing, auth)
- [ ] Domain outbox verification tests

#### E2E Tests
- [ ] Auth fixture (authenticated page)
- [ ] Catalog E2E tests (create, edit, delete, upload)
- [ ] Service center E2E tests (create with map picker)
- [ ] Content E2E tests (create, publish workflow)
- [ ] Review E2E tests (approve/reject)
- [ ] Golden path E2E test (complete admin workflow)

#### Smoke Tests
- [ ] Smoke test script for all services
- [ ] Make executable and test

#### CI/CD
- [ ] GitHub Actions workflow for tests
- [ ] Unit + integration job
- [ ] E2E job with Playwright
- [ ] Coverage upload
- [ ] Test report artifacts

#### Validation
- [ ] All unit tests pass (80%+ coverage)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Smoke tests pass
- [ ] CI pipeline green
- [ ] Test reports generated

**Commit:** `test(R1): add comprehensive integration and E2E test suites`

---

## Final R1 Delivery Checklist

### Documentation
- [ ] Update main README with R1 status
- [ ] Create quick-start guide for R1
- [ ] API documentation (OpenAPI specs generated)
- [ ] Environment variable documentation

### Deployment Readiness
- [ ] All services run via `docker-compose up` (infra only)
- [ ] All apps start via `nx serve`
- [ ] Seed data script created and tested
- [ ] Database migrations verified

### Quality Gates
- [ ] Zero TypeScript errors across all projects
- [ ] Zero ESLint errors
- [ ] All tests passing
- [ ] 80%+ code coverage on backend services
- [ ] E2E smoke test passing

### Git & Release
- [ ] All tasks committed with proper messages
- [ ] Feature branch merged to develop
- [ ] Tag release: `v1.0.0-r1`
- [ ] Release notes created

---

## Progress Tracking

| Task | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| Task 01: Backend Foundation |  Pending | - | - | |
| Task 02: Catalog Service |  Pending | - | - | |
| Task 03: Service Center |  Pending | - | - | |
| Task 04: Content Service |  Pending | - | - | |
| Task 05: Review Moderation |  Pending | - | - | |
| Task 06: Admin Console |  Pending | - | - | |
| Task 07: Testing |  Pending | - | - | |

**Legend:**
-  Pending
- =á In Progress
-  Complete
- L Blocked

---

## Notes & Issues

_Track blockers, decisions, and important notes here as development progresses._

---

**End of R1 Checklist**

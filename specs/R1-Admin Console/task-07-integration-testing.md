# Task 07: Integration & E2E Testing - Quality Assurance

**Parent Spec:** `spec.md` (R1 - Admin Console)
**Status:** Not Started
**Estimated Effort:** 2-3 days
**Dependencies:** Tasks 01-06 (All services and frontend) complete

---

## References to Main Spec

- **Testing Strategy:** Section 8 - Testing Strategy
- **Golden Path:** Section 18 - Golden Path (Combined E2E)
- **Acceptance Criteria:** Section 10 - Acceptance Criteria

---

## Objective

Establish comprehensive testing coverage for R1:
1. Integration tests for all service endpoints
2. E2E tests for critical admin workflows
3. Contract tests between gateway and services
4. Smoke tests for deployment verification
5. Performance baseline tests

---

## Testing Pyramid for R1

```
        /\
       /  \      E2E (Playwright)
      /────\     ~15 tests covering critical paths
     /      \
    /────────\   Integration (Jest + Supertest)
   /          \  ~50 tests covering all API endpoints
  /────────────\
 /              \ Unit (Jest)
/────────────────\ ~150 tests covering domain logic
```

---

## Test Categories

### 1. Unit Tests (Already in Tasks 01-06)
- Domain entities and value objects
- Use-case business logic
- Utility functions
- **Target:** 80%+ coverage per service

### 2. Integration Tests (This Task - Phase 1)
- API endpoint validation
- Database operations
- Service-to-service communication via gateway

### 3. E2E Tests (This Task - Phase 2)
- Complete admin workflows
- Browser-based UI interactions
- Cross-service operations

### 4. Smoke Tests (This Task - Phase 3)
- Quick health checks for all services
- Basic CRUD verification
- Pre-deployment validation

---

## Phase 1: Integration Testing

### Setup

**Create test utilities package:**
```bash
npx nx g @nx/node:library testing --directory=libs/shared --importPath=@motorghar/testing
```

**File: `libs/shared/testing/src/test-server.ts`**
```typescript
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export class TestServer {
  private prisma: PrismaClient;

  constructor() {
    // Use test database
    const testDbUrl = process.env.DATABASE_URL?.replace('motorghar', 'motorghar_test');
    this.prisma = new PrismaClient({
      datasources: { db: { url: testDbUrl } },
    });
  }

  async setup() {
    // Reset database
    await this.prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
    await this.prisma.$executeRawUnsafe('CREATE SCHEMA public');

    // Run migrations
    execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: this.getTestDbUrl() } });
  }

  async teardown() {
    await this.prisma.$disconnect();
  }

  async cleanup() {
    // Truncate all tables
    const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
      }
    }
  }

  getTestDbUrl() {
    return process.env.DATABASE_URL?.replace('motorghar', 'motorghar_test') || '';
  }

  getPrisma() {
    return this.prisma;
  }
}
```

**File: `libs/shared/testing/src/factories.ts`**
```typescript
import { randomUUID } from 'crypto';
import { CreateVehicleCatalog, CreateServiceCenter, CreateContentPost } from '@motorghar/contracts';

export const catalogFactory = {
  build: (overrides?: Partial<CreateVehicleCatalog>): CreateVehicleCatalog => ({
    make: 'Honda',
    model: 'CBR250R',
    year: 2024,
    trim: 'Standard',
    fuelType: 'Petrol',
    specs: {},
    media: [],
    ...overrides,
  }),
};

export const centerFactory = {
  build: (overrides?: Partial<CreateServiceCenter>): CreateServiceCenter => ({
    name: 'Test Auto Center',
    address: 'Kathmandu, Nepal',
    phone: '+977-1-4444444',
    email: 'test@autocenter.com',
    geo: { latitude: 27.7172, longitude: 85.324 },
    services: ['repair', 'maintenance'],
    ...overrides,
  }),
};

export const contentFactory = {
  build: (overrides?: Partial<CreateContentPost>): CreateContentPost => ({
    type: 'news',
    title: 'Test News Article',
    bodyMd: '# Test\n\nThis is a test article.',
    excerpt: 'Test excerpt',
    status: 'draft',
    media: [],
    vehicleIds: [],
    ...overrides,
  }),
};
```

### Integration Test Suite Template

**File: `apps/motorghar/svc-catalog/test/integration/catalog.integration.spec.ts`**
```typescript
import { buildApp } from '../../src/app';
import { TestServer } from '@motorghar/testing';
import { catalogFactory } from '@motorghar/testing';
import { FastifyInstance } from 'fastify';

describe('Catalog Service Integration Tests', () => {
  let app: FastifyInstance;
  let testServer: TestServer;

  beforeAll(async () => {
    testServer = new TestServer();
    await testServer.setup();
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    await testServer.teardown();
  });

  beforeEach(async () => {
    await testServer.cleanup();
  });

  describe('POST /vehicles', () => {
    it('should create vehicle catalog entry', async () => {
      const payload = catalogFactory.build();

      const response = await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.id).toBeDefined();
      expect(body.data.make).toBe(payload.make);
      expect(body.data.model).toBe(payload.model);
    });

    it('should enforce unique constraint on make/model/year/trim', async () => {
      const payload = catalogFactory.build();

      // Create first
      await app.inject({ method: 'POST', url: '/vehicles', payload });

      // Try to create duplicate
      const response = await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('DUPLICATE_ENTRY');
    });

    it('should validate year range', async () => {
      const payload = catalogFactory.build({ year: 1800 });

      const response = await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /vehicles', () => {
    it('should list vehicles with pagination', async () => {
      // Create 3 vehicles
      for (let i = 0; i < 3; i++) {
        await app.inject({
          method: 'POST',
          url: '/vehicles',
          payload: catalogFactory.build({ model: `Model${i}` }),
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/vehicles?limit=2&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(3);
      expect(body.meta.limit).toBe(2);
    });

    it('should filter by make', async () => {
      await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload: catalogFactory.build({ make: 'Honda' }),
      });
      await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload: catalogFactory.build({ make: 'Yamaha' }),
      });

      const response = await app.inject({
        method: 'GET',
        url: '/vehicles?make=Honda',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].make).toBe('Honda');
    });
  });

  describe('PATCH /vehicles/:id', () => {
    it('should update vehicle', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload: catalogFactory.build(),
      });

      const vehicleId = JSON.parse(createRes.body).data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/vehicles/${vehicleId}`,
        payload: { trim: 'Updated Trim' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.trim).toBe('Updated Trim');
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('should soft delete vehicle', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload: catalogFactory.build(),
      });

      const vehicleId = JSON.parse(createRes.body).data.id;

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/vehicles/${vehicleId}`,
      });

      expect(deleteRes.statusCode).toBe(204);

      // Verify soft delete
      const getRes = await app.inject({
        method: 'GET',
        url: `/vehicles/${vehicleId}`,
      });

      expect(getRes.statusCode).toBe(404);
    });
  });

  describe('Domain Events', () => {
    it('should log event to outbox on create', async () => {
      await app.inject({
        method: 'POST',
        url: '/vehicles',
        payload: catalogFactory.build(),
      });

      const prisma = testServer.getPrisma();
      const events = await prisma.domainOutbox.findMany({
        where: { eventType: 'CatalogVehicleCreated#v1' },
      });

      expect(events).toHaveLength(1);
      expect(events[0].aggregateType).toBe('vehicle.catalog#v1');
    });
  });
});
```

**Similar integration tests needed for:**
- Service Center Service
- Content Service
- Garage Service (Reviews)
- Gateway (routing and auth)

---

## Phase 2: E2E Testing with Playwright

### Setup Playwright

**Command:**
```bash
npx nx g @nx/playwright:configuration --project=web-admin-console
```

**File: `apps/motorghar/web-admin-console-e2e/playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  fullyParallel: false, // Run serially for E2E
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npx nx serve web-admin-console',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Fixtures

**File: `apps/motorghar/web-admin-console-e2e/src/fixtures/auth.ts`**
```typescript
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name=email]', 'admin@motorghar.test');
    await page.fill('[name=password]', 'admin123');
    await page.click('button[type=submit]');
    await page.waitForURL('/dashboard');

    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### E2E Test Suites

**File: `apps/motorghar/web-admin-console-e2e/src/catalog.spec.ts`**
```typescript
import { test, expect } from './fixtures/auth';

test.describe('Catalog Management', () => {
  test('should create, view, edit, and delete vehicle', async ({ authenticatedPage: page }) => {
    // Navigate to catalog
    await page.click('text=Catalog');
    await expect(page).toHaveURL('/catalog');

    // Create new vehicle
    await page.click('text=Add Vehicle');
    await expect(page).toHaveURL('/catalog/new');

    await page.fill('[name=make]', 'Honda');
    await page.fill('[name=model]', 'CBR250R');
    await page.fill('[name=year]', '2024');
    await page.fill('[name=trim]', 'Sport');
    await page.click('button:has-text("Create")');

    // Verify success toast
    await expect(page.locator('.sonner-toast')).toContainText('created successfully');

    // Verify redirect to list
    await expect(page).toHaveURL('/catalog');

    // Verify vehicle in list
    await expect(page.locator('table')).toContainText('Honda CBR250R');

    // Edit vehicle
    await page.click('table tr:has-text("Honda CBR250R") a:has(svg[class*="pencil"])');
    await page.fill('[name=trim]', 'Updated Sport');
    await page.click('button:has-text("Update")');

    await expect(page.locator('.sonner-toast')).toContainText('updated successfully');

    // Delete vehicle
    await page.click('table tr:has-text("Honda CBR250R") button:has(svg[class*="trash"])');
    await page.click('button:has-text("Confirm")'); // Confirm dialog

    await expect(page.locator('.sonner-toast')).toContainText('deleted successfully');
    await expect(page.locator('table')).not.toContainText('Honda CBR250R');
  });

  test('should upload media to vehicle', async ({ authenticatedPage: page }) => {
    // Create vehicle first
    await page.goto('/catalog/new');
    await page.fill('[name=make]', 'Yamaha');
    await page.fill('[name=model]', 'R15');
    await page.fill('[name=year]', '2024');
    await page.click('button:has-text("Create")');

    // Navigate to edit
    await page.click('table tr:has-text("Yamaha R15") a:has(svg[class*="pencil"])');

    // Upload media
    const fileInput = page.locator('input[type=file]');
    await fileInput.setInputFiles('./test-assets/bike.jpg');

    // Wait for upload
    await expect(page.locator('.media-preview')).toBeVisible();
    await expect(page.locator('.media-preview img')).toHaveAttribute('src', /http/);
  });
});
```

**File: `apps/motorghar/web-admin-console-e2e/src/service-centers.spec.ts`**
```typescript
import { test, expect } from './fixtures/auth';

test.describe('Service Center Management', () => {
  test('should create center with map picker', async ({ authenticatedPage: page }) => {
    await page.click('text=Service Centers');
    await page.click('text=Add Center');

    await page.fill('[name=name]', 'Kathmandu Auto Center');
    await page.fill('[name=address]', 'Thamel, Kathmandu');
    await page.fill('[name=phone]', '+977-1-4444444');

    // Click on map to set coordinates
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 200, y: 200 } });

    await page.click('button:has-text("Create")');

    await expect(page.locator('.sonner-toast')).toContainText('created successfully');
    await expect(page.locator('table')).toContainText('Kathmandu Auto Center');
  });
});
```

**File: `apps/motorghar/web-admin-console-e2e/src/content.spec.ts`**
```typescript
import { test, expect } from './fixtures/auth';

test.describe('Content Management', () => {
  test('should create and publish content post', async ({ authenticatedPage: page }) => {
    await page.click('text=Content');
    await page.click('text=Create Post');

    await page.selectOption('[name=type]', 'news');
    await page.fill('[name=title]', 'Honda Launches New Model');
    await page.fill('[name=bodyMd]', '# Exciting News\n\nHonda has launched a new model...');
    await page.selectOption('[name=status]', 'draft');

    await page.click('button:has-text("Create")');

    await expect(page.locator('.sonner-toast')).toContainText('created successfully');

    // Publish the post
    await page.click('table tr:has-text("Honda Launches") button:has-text("Publish")');

    await expect(page.locator('table tr:has-text("Honda Launches")')).toContainText('published');
  });

  test('should filter content by type', async ({ authenticatedPage: page }) => {
    await page.goto('/content');

    // Filter by news
    await page.selectOption('[name=typeFilter]', 'news');

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(await rows.count());
    // Verify all rows are news type
    for (let i = 0; i < await rows.count(); i++) {
      await expect(rows.nth(i)).toContainText('news');
    }
  });
});
```

**File: `apps/motorghar/web-admin-console-e2e/src/reviews.spec.ts`**
```typescript
import { test, expect } from './fixtures/auth';

test.describe('Review Moderation', () => {
  test('should approve pending review', async ({ authenticatedPage: page }) => {
    await page.click('text=Reviews');

    // Filter to show only pending
    await page.selectOption('[name=approvedFilter]', 'false');

    // Approve first review
    await page.click('table tbody tr:first-child button:has-text("Approve")');

    await expect(page.locator('.sonner-toast')).toContainText('approved');

    // Verify review moved to approved
    await page.selectOption('[name=approvedFilter]', 'true');
    await expect(page.locator('table tbody')).toHaveCount(1);
  });
});
```

### Golden Path E2E Test

**File: `apps/motorghar/web-admin-console-e2e/src/golden-path.spec.ts`**
```typescript
import { test, expect } from './fixtures/auth';

test.describe('Golden Path - Admin creates catalog, center, and content', () => {
  test('complete admin workflow', async ({ authenticatedPage: page }) => {
    // 1. Create vehicle catalog
    await page.click('text=Catalog');
    await page.click('text=Add Vehicle');
    await page.fill('[name=make]', 'Honda');
    await page.fill('[name=model]', 'CBR500R');
    await page.fill('[name=year]', '2024');
    await page.click('button:has-text("Create")');
    await expect(page.locator('.sonner-toast')).toContainText('created');

    // 2. Create service center
    await page.click('text=Service Centers');
    await page.click('text=Add Center');
    await page.fill('[name=name]', 'Honda Service Center');
    await page.fill('[name=address]', 'Lalitpur, Nepal');
    await page.click('button:has-text("Create")');
    await expect(page.locator('.sonner-toast')).toContainText('created');

    // 3. Create content post linking to vehicle
    await page.click('text=Content');
    await page.click('text=Create Post');
    await page.selectOption('[name=type]', 'news');
    await page.fill('[name=title]', 'New Honda CBR500R Available');
    await page.fill('[name=bodyMd]', '# Great News\n\nThe CBR500R is now available!');

    // Link to vehicle (assuming multi-select for vehicleIds)
    await page.click('[name=vehicleIds]');
    await page.click('text=Honda CBR500R');

    await page.click('button:has-text("Create")');
    await expect(page.locator('.sonner-toast')).toContainText('created');

    // Verify dashboard shows all created items
    await page.click('text=Dashboard');
    await expect(page.locator('.stats')).toContainText('1 vehicle');
    await expect(page.locator('.stats')).toContainText('1 center');
    await expect(page.locator('.stats')).toContainText('1 post');
  });
});
```

---

## Phase 3: Smoke Tests

**File: `tests/smoke/smoke.spec.ts`**
```bash
#!/bin/bash

# Smoke test script for deployment verification

echo "🔥 Running smoke tests..."

BASE_URL=${BASE_URL:-http://localhost:3000}

# Test gateway health
echo "Testing gateway..."
curl -f $BASE_URL/health || exit 1

# Test catalog service
echo "Testing catalog service..."
curl -f $BASE_URL/v1/catalog/vehicles || exit 1

# Test service center service
echo "Testing service center service..."
curl -f $BASE_URL/v1/centers || exit 1

# Test content service
echo "Testing content service..."
curl -f $BASE_URL/v1/content/posts || exit 1

# Test reviews
echo "Testing reviews..."
curl -f $BASE_URL/v1/reviews || exit 1

echo "✅ All smoke tests passed!"
```

---

## Test Execution Commands

```bash
# Unit tests (all services)
npx nx run-many --target=test --all

# Integration tests (specific service)
npx nx test svc-catalog --testPathPattern=integration

# E2E tests
npx nx e2e web-admin-console-e2e

# Smoke tests
chmod +x tests/smoke/smoke.spec.ts
./tests/smoke/smoke.spec.ts

# Test coverage report
npx nx run-many --target=test --all --coverage
```

---

## Acceptance Criteria

- [ ] All unit tests pass (80%+ coverage per service)
- [ ] All integration tests pass for each service
- [ ] E2E tests cover critical admin workflows:
  - [ ] Login/logout
  - [ ] Catalog CRUD + media upload
  - [ ] Service center CRUD + map picker
  - [ ] Content CRUD + publish workflow
  - [ ] Review moderation
  - [ ] Golden path test passes
- [ ] Smoke tests executable and passing
- [ ] CI pipeline configured to run all tests
- [ ] Test reports generated (coverage, E2E screenshots)
- [ ] All tests can run in isolated environment (test database)

---

## CI/CD Integration

**File: `.github/workflows/r1-test.yml`**
```yaml
name: R1 Test Suite

on:
  push:
    branches: [main, develop, feature/stage-1]
  pull_request:
    branches: [main, develop]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
      minio:
        image: minio/minio
        ports:
          - 9000:9000
        env:
          MINIO_ROOT_USER: minioadmin
          MINIO_ROOT_PASSWORD: minioadmin

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npx nx run-many --target=test --all --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx nx e2e web-admin-console-e2e

      - name: Upload E2E artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/motorghar/web-admin-console-e2e/playwright-report/
```

---

## Next Steps

After completion:
1. Commit: `test(R1): add comprehensive integration and E2E test suites`
2. Create release tag: `v1.0.0-r1`
3. Update main todo.md with results
4. Prepare R1 delivery documentation
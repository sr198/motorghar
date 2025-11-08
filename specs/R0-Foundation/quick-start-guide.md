# R0 Foundation - Quick Start Guide

**Goal:** Get MotorGhar infrastructure running and all applications building/serving successfully.

---

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js 20+
- ✅ pnpm 8+
- ✅ Docker & Docker Compose
- ✅ Git

---

## Step 1: Install Dependencies

```bash
# From project root
pnpm install
```

**Expected outcome:** All dependencies installed without errors.

---

## Step 2: Setup Infrastructure Environment

Create environment file for Docker services:

```bash
# Create infra directory if it doesn't exist
mkdir -p infra

# Create infra/.env
cat > infra/.env << 'EOF'
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
EOF
```

---

## Step 3: Create Docker Compose File

Create `infra/docker-compose.yml` with PostgreSQL, Redis, and MinIO services.

*(See spec.md for complete docker-compose.yml configuration)*

---

## Step 4: Start Infrastructure

```bash
cd infra

# Docker Compose automatically loads .env from the current directory
# Alternatively, you can be explicit: docker-compose --env-file .env up -d
docker-compose up -d

# Verify all services are healthy
docker-compose ps
```

**Note:** Docker Compose automatically reads the `.env` file from the same directory as `docker-compose.yml`. The environment variables are used for:
1. Variable substitution in `docker-compose.yml` (e.g., `${POSTGRES_PORT}`)
2. Passing to containers via `env_file: - .env`

**Expected outcome:**
- PostgreSQL running on port 5432
- Redis running on port 6379
- MinIO API on port 9000
- MinIO Console on port 9001

**Verify connections:**
```bash
# Test PostgreSQL
docker exec -it motorghar-postgres psql -U motorghar -d motorghar -c "SELECT 1;"

# Test Redis
docker exec -it motorghar-redis redis-cli PING

# MinIO Console: Open http://localhost:9001
# Login: minio / minio123
```

---

## Step 5: Setup Application Environment

Create root `.env` file for applications:

```bash
# From project root
cat > .env << 'EOF'
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
EOF
```

Also create `.env.example` for team reference (copy from spec.md).

---

## Step 6: Setup Prisma Schema

Create `prisma/schema.prisma` with all models.

*(See spec.md for complete Prisma schema)*

**Configure Nx Prisma targets** in root `project.json` or create a dedicated project for Prisma operations.

---

## Step 7: Generate Prisma Client

```bash
nx run motorghar:prisma:generate
```

**Expected outcome:** Prisma Client generated in `node_modules/@prisma/client`

---

## Step 8: Run Database Migrations

```bash
# Create initial migration
nx run motorghar:prisma:migrate
# When prompted for migration name, use: "initial_schema"
```

**Expected outcome:** Migration files created in `prisma/migrations/` and tables created in PostgreSQL.

**Verify tables:**
```bash
# Via Prisma Studio (opens in browser)
nx run motorghar:prisma:studio

# OR via psql
docker exec -it motorghar-postgres psql -U motorghar -d motorghar -c "\dt"
```

---

## Step 9: Seed Database

Create `prisma/seed.ts` and configure in `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seed:
```bash
nx run motorghar:prisma:seed
```

**Expected outcome:**
- Vehicle catalog entries created
- Service centers created
- Content posts created

**Verify seed data:**
```bash
nx run motorghar:prisma:studio
# Browse to http://localhost:5555 and check tables
```

---

## Step 10: Configure Applications

For each application in `apps/motorghar/*`:

1. **Backend Services** (fastify-gateway, svc-*):
   - Add health endpoint
   - Configure port from environment variable
   - Add Prisma client connection
   - Add Redis connection (if needed)

2. **Frontend Apps** (web-*):
   - Configure Next.js port
   - Add basic homepage

3. **Mobile App** (mobile-mygarage):
   - Configure Metro bundler port
   - Add basic screen

---

## Step 11: Build All Applications

```bash
nx run-many --target=build --all
```

**Expected outcome:** All applications build successfully with no TypeScript errors.

**Troubleshooting:**
- If build fails, check TypeScript errors
- Verify all imports are correct
- Check `tsconfig.json` path mappings

---

## Step 12: Test Individual Services

Start each service in a separate terminal:

```bash
# Terminal 1 - Gateway
nx serve fastify-gateway
# Should start on http://localhost:3000

# Terminal 2 - Catalog Service
nx serve svc-catalog
# Should start on http://localhost:3001

# Terminal 3 - Content Service
nx serve svc-content
# Should start on http://localhost:3002

# Terminal 4 - Service Center Service
nx serve svc-service-center
# Should start on http://localhost:3003

# Terminal 5 - Garage Service
nx serve svc-garage
# Should start on http://localhost:3004

# Terminal 6 - Admin Console
nx serve web-admin-console
# Should start on http://localhost:4000

# Terminal 7 - My Garage Web
nx serve web-mygarage
# Should start on http://localhost:4001
```

**Verify each service:**
```bash
# Check health endpoints
curl http://localhost:3000/health  # Gateway
curl http://localhost:3001/health  # Catalog
curl http://localhost:3002/health  # Content
curl http://localhost:3003/health  # Service Center
curl http://localhost:3004/health  # Garage

# Check web apps
open http://localhost:4000  # Admin Console
open http://localhost:4001  # My Garage
```

---

## Step 13: Run Linting

```bash
nx run-many --target=lint --all
```

**Expected outcome:** No linting errors.

---

## Step 14: Run Tests (if available)

```bash
nx run-many --target=test --all
```

**Expected outcome:** All tests pass.

---

## Common Commands Reference

```bash
# Infrastructure
cd infra && docker-compose up -d           # Start infrastructure
cd infra && docker-compose down            # Stop infrastructure
cd infra && docker-compose ps              # Check status
cd infra && docker-compose logs -f         # View logs

# Prisma
nx run motorghar:prisma:generate           # Generate Prisma Client
nx run motorghar:prisma:migrate            # Run migrations (dev)
nx run motorghar:prisma:migrate:deploy     # Deploy migrations (production)
nx run motorghar:prisma:seed               # Seed database
nx run motorghar:prisma:studio             # Open Prisma Studio

# Build & Serve
nx run-many --target=build --all          # Build all apps
nx serve <app-name>                        # Serve specific app
nx build <app-name>                        # Build specific app

# Quality
nx run-many --target=lint --all           # Lint all apps
nx run-many --target=test --all           # Test all apps

# Utilities
pnpm install                               # Install dependencies
nx graph                                   # View dependency graph
nx reset                                   # Clear Nx cache
```

---

## Port Reference

### Infrastructure (Docker)
- PostgreSQL: `5432`
- Redis: `6379`
- MinIO API: `9000`
- MinIO Console: `9001` (http://localhost:9001)
- pgAdmin: `5050` (http://localhost:5050)

### Applications (Local Processes)
- Gateway: `3000` (http://localhost:3000)
- Catalog Service: `3001` (http://localhost:3001)
- Content Service: `3002` (http://localhost:3002)
- Service Center Service: `3003` (http://localhost:3003)
- Garage Service: `3004` (http://localhost:3004)
- Admin Console: `4000` (http://localhost:4000)
- My Garage Web: `4001` (http://localhost:4001)
- Mobile Metro: `8081` (http://localhost:8081)

---

## Troubleshooting

### Docker Issues

**Problem:** PostgreSQL won't start
```bash
# Check logs
docker-compose logs postgres

# Remove volume and restart
docker-compose down -v
docker-compose up -d
```

**Problem:** Port already in use
```bash
# Find process using port
lsof -i :5432  # or any other port
# Kill the process or change port in infra/.env
```

### Prisma Issues

**Problem:** "Can't reach database server"
```bash
# Verify PostgreSQL is running
docker-compose ps

# Check DATABASE_URL in .env
# Make sure it matches infra/.env credentials
```

**Problem:** Migration failed
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
nx run prisma:migrate
nx run prisma:seed
```

### Application Issues

**Problem:** TypeScript errors during build
```bash
# Clear Nx cache
nx reset

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild
nx run-many --target=build --all
```

**Problem:** Port already in use
```bash
# Check what's using the port
lsof -i :3000  # or the specific port

# Change port in .env
# Edit PORT_GATEWAY=3100 (or any available port)
```

---

## Success Criteria

✅ All infrastructure services running (docker-compose ps shows "Up")
✅ Database tables created (visible in Prisma Studio)
✅ Seed data populated
✅ All applications build successfully
✅ Each application can be served on its assigned port
✅ Health endpoints return 200 OK
✅ No TypeScript or linting errors

---

## Next Steps

Once R0 is complete, you're ready for **R1 – Admin Console Vertical**!

R1 will build:
- Catalog service API (CRUD)
- Content service API (CRUD)
- Service Center service API (CRUD)
- Admin Console UI (Next.js)
- Full vertical slice from UI → API → Database

# Development Guide

This document provides detailed development guidelines, architecture decisions, and best practices for the MotorGhar project.

## Architecture Overview

### Microservices Architecture

MotorGhar follows a microservices architecture with domain-driven design principles:

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (3000)                       │
│                     fastify-gateway                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│  svc-catalog   │   │  svc-content   │   │ svc-service-   │
│     (3001)     │   │     (3002)     │   │   center       │
│                │   │                │   │     (3003)     │
└────────────────┘   └────────────────┘   └────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼────────┐
                    │   svc-garage     │
                    │      (3004)      │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│   PostgreSQL   │   │     Redis      │   │     MinIO      │
│     (5432)     │   │     (6379)     │   │  (9000/9001)   │
└────────────────┘   └────────────────┘   └────────────────┘
```

### Service Responsibilities

#### fastify-gateway (Port 3000)
- **Role**: API Gateway and BFF (Backend for Frontend)
- **Responsibilities**:
  - Route requests to appropriate microservices
  - Authentication & authorization
  - Request/response transformation
  - Rate limiting
- **Dependencies**: All microservices, Redis (sessions)

#### svc-catalog (Port 3001)
- **Role**: Vehicle catalog management
- **Responsibilities**:
  - Vehicle make/model/variant management
  - Vehicle specifications
  - Vehicle media
- **Domain**: VehicleCatalog, VehicleVariant, VehicleCatalogMedia

#### svc-content (Port 3002)
- **Role**: Content management
- **Responsibilities**:
  - News articles
  - Events
  - Videos
  - Recall notices
- **Domain**: ContentPost

#### svc-service-center (Port 3003)
- **Role**: Service center management
- **Responsibilities**:
  - Service center locations
  - Appointment scheduling
  - Service center details
- **Domain**: ServiceCenter, ServiceAppointment

#### svc-garage (Port 3004)
- **Role**: User vehicle management
- **Responsibilities**:
  - User-owned vehicles
  - Vehicle notes and media
  - Vehicle reviews
- **Domain**: OwnerVehicle, OwnerVehicleNote, OwnerVehicleMedia, OwnerVehicleReview

### Frontend Applications

#### web-admin-console (Port 4000)
- **Technology**: Next.js 15 with App Router
- **Purpose**: Admin panel for managing content, vehicles, service centers
- **Features**: Server-side rendering, Admin UI, Data management

#### web-mygarage (Port 4001)
- **Technology**: Next.js 15 with App Router
- **Purpose**: Public-facing web application for users
- **Features**: SEO-optimized, Vehicle browsing, User garage management

#### mobile-mygarage (Port 8081 - Metro)
- **Technology**: React Native
- **Purpose**: Native mobile apps (iOS & Android)
- **Features**: Native components, Device APIs, Offline support

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify 5.x
- **Language**: TypeScript 5.9+
- **ORM**: Prisma 6.19+
- **Validation**: Zod 4.x
- **Database**: PostgreSQL 16 with PostGIS
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)

### Frontend
- **Web**: Next.js 15.2+ with React 19
- **Mobile**: React Native 0.79+
- **State Management**: Zustand, Jotai, TanStack Query
- **Styling**: Tailwind CSS, CSS Modules
- **Forms**: React Hook Form + Zod

### DevOps
- **Monorepo**: Nx 22.x
- **Package Manager**: pnpm 8.x
- **Containerization**: Docker & Docker Compose
- **CI/CD**: (TBD in future phases)

## Development Workflow

### 1. Environment Setup

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
```

### 2. Running Services

```bash
# Run all backend services in separate terminals
nx serve fastify-gateway
nx serve svc-catalog
nx serve svc-content
nx serve svc-service-center
nx serve svc-garage

# Run frontend apps
nx serve motorghar-web-admin-console
nx serve motorghar-web-mygarage
nx start motorghar-mobile-mygarage
```

### 3. Making Changes

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes, test locally

# Lint and format
nx run-many --target=lint --all
pnpm format

# Build to verify no errors
nx run-many --target=build --all

# Commit changes
git add .
git commit -m "feat: add my feature"
```

## Code Organization

### Shared Libraries

#### `libs/shared/contracts`
- API contracts defined with Zod
- Request/response schemas
- Shared validation logic

#### `libs/shared/types`
- Branded ID types (e.g., `VehicleId`, `UserId`)
- Common TypeScript types
- Enum definitions

#### `libs/shared/config`
- ESLint configurations
- TypeScript base configs
- Jest presets
- Prettier config

#### `libs/shared/testing`
- Test utilities
- Mock factories
- Test helpers

#### `libs/shared/ui`
- Shared React components
- Common UI elements

### MotorGhar Libraries

#### `libs/motorghar/domain`
- Domain entities
- Value objects
- Domain logic
- Business rules

#### `libs/motorghar/adapters`
- Prisma repositories
- Redis client
- MinIO storage adapter
- Outbox writer (event publishing)

#### `libs/motorghar/services`
- Inter-service communication clients
- Service abstractions

#### `libs/motorghar/constants`
- Event names
- Entity type constants
- ID prefixes

## Database & Prisma

### Schema Design

The database follows a shared schema approach where all microservices access the same PostgreSQL database but own their respective tables.

**Domain Ownership:**
- **Catalog Service**: `vehicle_catalog`, `vehicle_catalog_media`
- **Garage Service**: `owner_vehicle`, `owner_vehicle_note`, `owner_vehicle_media`, `owner_vehicle_review`
- **Service Center Service**: `service_center`, `service_appointment`
- **Content Service**: `content_post`
- **Shared**: `domain_outbox` (event outbox pattern)

### Prisma Workflow

```bash
# After schema changes
nx run prisma:generate      # Generate Prisma Client
nx run prisma:migrate       # Create and apply migration
nx run prisma:seed          # Seed with sample data
nx run prisma:studio        # Open Prisma Studio UI
```

### Migrations

- All migrations are stored in `prisma/migrations/`
- Migrations are **version controlled** and **never deleted**
- Use descriptive migration names
- Always test migrations locally before deploying

## Environment Variables

### Infrastructure (.env in infra/)
```env
POSTGRES_USER=motorghar
POSTGRES_PASSWORD=motorghar123
POSTGRES_DB=motorghar
REDIS_PORT=6379
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
```

### Application (.env in root)
```env
DATABASE_URL=postgresql://motorghar:motorghar123@localhost:5432/motorghar
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
PORT_GATEWAY=3000
PORT_SVC_CATALOG=3001
# ... etc
```

**Security Notes:**
- Never commit `.env` files
- Use `.env.example` as template
- Rotate credentials in production
- Use secrets management in production

## Testing Strategy

### Unit Tests
```bash
# Run all unit tests
nx run-many --target=test --all

# Run specific app tests
nx test svc-catalog

# Watch mode
nx test svc-catalog --watch
```

### Integration Tests
- Test database interactions
- Test service-to-service communication
- Test API endpoints with real dependencies

### E2E Tests
- Full user flow testing
- Frontend + Backend integration
- (To be implemented in future phases)

## Code Style & Conventions

### TypeScript

- Use **strict mode** (`strict: true`)
- Prefer **interfaces** for object shapes
- Use **type** for unions, intersections, and aliases
- Avoid `any` - use `unknown` if needed

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Classes**: PascalCase (`UserService`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase with `I` prefix optional (`User` or `IUser`)

### Imports

```typescript
// Good - absolute imports using path mapping
import { UserService } from '@motorghar/services';
import { UserId } from '@shared/types';

// Avoid - relative imports for cross-library references
import { UserService } from '../../../services/user-service';
```

## Git Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user registration endpoint
fix: resolve null pointer in vehicle search
docs: update API documentation
refactor: extract validation logic to shared library
chore: update dependencies
```

## Performance Best Practices

### Database

- Use **indexes** on frequently queried columns
- Avoid N+1 queries - use Prisma `include` wisely
- Use **pagination** for large result sets
- Cache frequent queries in Redis

### API

- Implement **rate limiting** at gateway
- Use **compression** middleware
- Return only necessary fields
- Implement **caching headers**

### Frontend

- Use **React Server Components** where applicable (Next.js)
- Implement **lazy loading** for heavy components
- Optimize images (Next.js Image component)
- Use **TanStack Query** for data fetching and caching

## Security Considerations

- **Input validation**: All inputs validated with Zod schemas
- **SQL injection**: Protected by Prisma ORM
- **XSS**: React auto-escapes, be careful with `dangerouslySetInnerHTML`
- **CSRF**: Implement CSRF tokens for state-changing operations
- **Authentication**: JWT tokens, HTTP-only cookies
- **Authorization**: Role-based access control (RBAC)

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
cd infra && docker-compose logs postgres

# Reset database
cd infra && docker-compose down -v
cd infra && docker-compose up -d
nx run prisma:migrate
nx run prisma:seed
```

### Build Errors

```bash
# Clean Nx cache
nx reset

# Clean node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate Prisma Client
nx run prisma:generate
```

### Port Conflicts

```bash
# Check what's using a port
lsof -i :3000

# Kill process on port
kill -9 <PID>
```

## Resources

- [Nx Documentation](https://nx.dev)
- [Fastify Documentation](https://fastify.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

## Getting Help

- Check existing issues in GitHub
- Review this documentation
- Ask in team chat/Slack
- Create a new issue with detailed description
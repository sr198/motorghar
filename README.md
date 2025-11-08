# MotorGhar

**MotorGhar** is a comprehensive motorcycle and vehicle management platform built with modern web and mobile technologies.

## Architecture

- **Monorepo**: Nx-powered monorepo with TypeScript
- **Backend**: Fastify microservices architecture
- **Frontend**: Next.js (web) + React Native (mobile)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure (Docker)

```bash
cd infra
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (API: 9000, Console: 9001)
- pgAdmin (port 5050)

### 3. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Update .env with your values (defaults should work for local dev)
```

### 4. Setup Database

```bash
# Generate Prisma Client
nx run prisma:generate

# Run migrations
nx run prisma:migrate

# Seed database
nx run prisma:seed
```

### 5. Build & Run

```bash
# Build all packages
nx run-many --target=build --all

# Run backend services
nx serve fastify-gateway          # Port 3000
nx serve svc-catalog               # Port 3001
nx serve svc-content               # Port 3002
nx serve svc-service-center        # Port 3003
nx serve svc-garage                # Port 3004

# Run frontend apps
nx serve motorghar-web-admin-console    # Port 4000
nx serve motorghar-web-mygarage         # Port 4001

# Run mobile app (Metro bundler)
nx start motorghar-mobile-mygarage      # Port 8081
```

## Services & Ports

### Infrastructure (Docker)
| Service    | Port | Description        |
|------------|------|--------------------|
| PostgreSQL | 5432 | Database           |
| Redis      | 6379 | Cache/Sessions     |
| MinIO API  | 9000 | Object Storage     |
| MinIO UI   | 9001 | Storage Console    |
| pgAdmin    | 5050 | DB Management      |

### Applications (Local)
| Service                | Port | Description                |
|------------------------|------|----------------------------|
| fastify-gateway        | 3000 | API Gateway                |
| svc-catalog            | 3001 | Vehicle Catalog Service    |
| svc-content            | 3002 | Content Management Service |
| svc-service-center     | 3003 | Service Center Service     |
| svc-garage             | 3004 | User Garage Service        |
| web-admin-console      | 4000 | Admin Web App (Next.js)    |
| web-mygarage           | 4001 | User Web App (Next.js)     |
| mobile-mygarage (metro)| 8081 | Mobile App Metro Bundler   |

## Health Checks

```bash
# Gateway (includes Redis check)
curl http://localhost:3000/health

# Backend services (include DB check)
curl http://localhost:3001/health  # Catalog
curl http://localhost:3002/health  # Content
curl http://localhost:3003/health  # Service Center
curl http://localhost:3004/health  # Garage
```

## Common Commands

### Prisma

```bash
# Generate Prisma Client
nx run prisma:generate

# Create migration
nx run prisma:migrate

# Apply migrations (production)
nx run prisma:migrate:deploy

# Seed database
nx run prisma:seed

# Open Prisma Studio
nx run prisma:studio
```

### Build & Test

```bash
# Build all
nx run-many --target=build --all

# Build specific app
nx build fastify-gateway

# Lint all
nx run-many --target=lint --all

# Test all
nx run-many --target=test --all
```

### Docker

```bash
# Start infrastructure
cd infra && docker-compose up -d

# Stop infrastructure
cd infra && docker-compose down

# View logs
cd infra && docker-compose logs -f

# Reset everything (WARNING: deletes data)
cd infra && docker-compose down -v
```

## Project Structure

```
motorghar/
├── apps/
│   └── motorghar/
│       ├── fastify-gateway/          # API Gateway
│       ├── svc-catalog/              # Catalog Microservice
│       ├── svc-content/              # Content Microservice
│       ├── svc-service-center/       # Service Center Microservice
│       ├── svc-garage/               # Garage Microservice
│       ├── web-admin-console/        # Admin Web App (Next.js)
│       ├── web-mygarage/             # User Web App (Next.js)
│       └── mobile-mygarage/          # Mobile App (React Native)
├── libs/
│   ├── shared/
│   │   ├── contracts/                # API contracts (Zod)
│   │   ├── types/                    # Shared TypeScript types
│   │   ├── config/                   # Shared configs
│   │   ├── testing/                  # Test utilities
│   │   └── ui/                       # Shared UI components
│   └── motorghar/
│       ├── domain/                   # Domain entities & logic
│       ├── adapters/                 # Prisma, Redis, MinIO adapters
│       ├── services/                 # Service clients
│       └── constants/                # App constants
├── infra/
│   ├── docker-compose.yml            # Infrastructure services
│   └── .env                          # Infrastructure config
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Database seed script
└── specs/                            # Project specifications
```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guidelines, architecture decisions, and best practices.

## License

MIT
# Task 05: Review Moderation - Garage Service (Read-Only)

**Parent Spec:** `spec.md` (R1 - Admin Console)
**Status:** Not Started
**Estimated Effort:** 1-2 days
**Dependencies:** Task 01 (Backend Foundation) complete

---

## References to Main Spec

- **Service Boundaries:** Section 2.1 (Garage Service - Reviews only in R1)
- **Database Schema:** Section 3.1 (owner_vehicle_review table)
- **API Contracts:** Section 4.2

---

## Objective

Build **limited functionality** of Garage Service for R1:
1. Read-only access to owner vehicle reviews
2. Approve/reject review moderation
3. Future-ready structure for full garage CRUD (R2)

**Note:** Full Garage Service (owner_vehicle CRUD, notes, media) is R2 scope. For R1, we only need review moderation.

---

## Implementation Summary

### Database Schema

```sql
-- Simplified for R1 (full schema in R2)
CREATE TABLE owner_vehicle_review (
  id VARCHAR(36) PRIMARY KEY,
  owner_vehicle_id VARCHAR(36) NOT NULL,  -- Foreign key deferred to R2
  user_id VARCHAR(36) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_approved ON owner_vehicle_review(approved);
CREATE INDEX idx_review_owner_vehicle ON owner_vehicle_review(owner_vehicle_id);
```

### Prisma Schema

**Add to `prisma/schema.prisma`:**
```prisma
model OwnerVehicleReview {
  id              String   @id @default(uuid())
  ownerVehicleId  String   @map("owner_vehicle_id")
  userId          String   @map("user_id")
  rating          Int      @db.Integer
  title           String?  @db.VarChar(200)
  comment         String?  @db.Text
  approved        Boolean  @default(false)

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([approved], name: "idx_review_approved")
  @@index([ownerVehicleId], name: "idx_review_owner_vehicle")
  @@map("owner_vehicle_review")
}
```

### Contracts

**File: `libs/shared/contracts/src/garage/owner-vehicle-review.ts`**
```typescript
import { z } from 'zod';

export const OwnerVehicleReviewQuerySchema = z.object({
  approved: z.coerce.boolean().optional(),
  userId: z.string().uuid().optional(),
  ownerVehicleId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const OwnerVehicleReviewSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('owner.vehicle.review#v1'),
  ownerVehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  approved: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ApproveReviewSchema = z.object({
  approved: z.boolean(),
});

export type OwnerVehicleReviewQuery = z.infer<typeof OwnerVehicleReviewQuerySchema>;
export type OwnerVehicleReview = z.infer<typeof OwnerVehicleReviewSchema>;
export type ApproveReview = z.infer<typeof ApproveReviewSchema>;
```

### Minimal File Structure (R1)

```
apps/motorghar/svc-garage/
├── src/
│   ├── domain/entities/owner-vehicle-review.entity.ts
│   ├── domain/events/review.events.ts
│   ├── ports/repositories/review.repository.ts
│   ├── adapters/db/review.repository.impl.ts
│   ├── app/use-cases/
│   │   ├── list-reviews.ts
│   │   ├── get-review.ts
│   │   └── moderate-review.ts  # Approve/reject
│   ├── controllers/review.controller.ts
│   ├── config/
│   ├── app.ts
│   └── main.ts
├── README.md  # Note: Full garage features in R2
```

### Key Use Case

**File: `apps/motorghar/svc-garage/src/app/use-cases/moderate-review.ts`**
```typescript
import { DomainOutboxPort } from '@motorghar/adapters';
import { DomainEventFactory } from '@motorghar/domain';
import { ReviewRepository } from '../../ports/repositories/review.repository';
import { ReviewEvents } from '../../domain/events/review.events';

export class ModerateReviewUseCase {
  constructor(
    private readonly repository: ReviewRepository,
    private readonly outbox: DomainOutboxPort
  ) {}

  async execute(reviewId: string, approved: boolean): Promise<OwnerVehicleReviewEntity> {
    const review = await this.repository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    review.setApproval(approved);
    const updated = await this.repository.update(review);

    const event = DomainEventFactory.create(
      'owner.vehicle.review#v1',
      reviewId,
      approved ? ReviewEvents.APPROVED : ReviewEvents.REJECTED,
      { reviewId, approved, userId: review.userId }
    );

    await this.outbox.append(event);

    return updated;
  }
}
```

### API Endpoints

```
GET    /reviews              List all reviews (filter by approved status)
GET    /reviews/:id          Get specific review
PATCH  /reviews/:id/approve  Approve or reject review
```

**Controller Example:**
```typescript
// apps/motorghar/svc-garage/src/controllers/review.controller.ts
export const reviewController: FastifyPluginAsync = async (fastify) => {
  const { reviewRepository, outbox } = (fastify as any).diContainer;

  // GET /reviews - List with filtering
  fastify.get('/reviews', async (request, reply) => {
    const query = OwnerVehicleReviewQuerySchema.parse(request.query);

    const { items, total } = await reviewRepository.findMany(query);

    return reply.send({
      data: items.map(item => item.toResponse()),
      meta: {
        total,
        limit: query.limit,
        offset: query.offset,
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  });

  // PATCH /reviews/:id/approve - Moderate
  fastify.patch('/reviews/:id/approve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = ApproveReviewSchema.parse(request.body);

    const useCase = new ModerateReviewUseCase(reviewRepository, outbox);
    const updated = await useCase.execute(id, body.approved);

    return reply.send({
      data: updated.toResponse(),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    });
  });
};
```

### Seed Data for Testing

Create some dummy reviews for moderation testing:

**File: `infra/seed/reviews.ts`**
```typescript
export const seedReviews = async (prisma: PrismaClient) => {
  await prisma.ownerVehicleReview.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        ownerVehicleId: 'dummy-vehicle-1',
        userId: 'dummy-user-1',
        rating: 5,
        title: 'Excellent bike!',
        comment: 'I love my Honda CBR250R. Great performance and fuel efficiency.',
        approved: false,
      },
      {
        id: crypto.randomUUID(),
        ownerVehicleId: 'dummy-vehicle-2',
        userId: 'dummy-user-2',
        rating: 4,
        title: 'Good but needs improvement',
        comment: 'Overall good, but suspension could be better.',
        approved: false,
      },
      {
        id: crypto.randomUUID(),
        ownerVehicleId: 'dummy-vehicle-3',
        userId: 'dummy-user-3',
        rating: 3,
        title: 'Average experience',
        comment: 'Nothing special, just average.',
        approved: true, // Already approved
      },
    ],
  });
};
```

---

## Testing

### Integration Test - Review Moderation
```typescript
describe('PATCH /reviews/:id/approve', () => {
  it('should approve pending review', async () => {
    // Assume review-1 exists and is pending
    const response = await app.inject({
      method: 'PATCH',
      url: '/reviews/review-1/approve',
      payload: { approved: true },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.approved).toBe(true);
  });

  it('should reject review', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/reviews/review-2/approve',
      payload: { approved: false },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.approved).toBe(false);
  });
});

describe('GET /reviews', () => {
  it('should filter by approved status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reviews?approved=false',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.every(r => r.approved === false)).toBe(true);
  });
});
```

---

## Acceptance Criteria

- [ ] Owner vehicle review table created
- [ ] Service starts on port 3004
- [ ] Can list all reviews
- [ ] Can filter by approved/pending
- [ ] Can get single review by ID
- [ ] Can approve review (sets approved = true)
- [ ] Can reject review (sets approved = false)
- [ ] Domain events logged for approval/rejection
- [ ] Seed data available for testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] README notes that full garage features are R2

---

## Commands

```bash
npx prisma migrate dev --name add_owner_vehicle_review_table
npx nx build svc-garage
npx nx test svc-garage
npx nx serve svc-garage

# Test
curl http://localhost:3004/reviews

curl -X PATCH http://localhost:3004/reviews/REVIEW_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"approved":true}'
```

---

## Next Steps

After completion:
1. Commit: `feat(R1): add garage service with review moderation`
2. Proceed to Task 06: Admin Console Frontend
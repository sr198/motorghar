# Task 04: Content Service - Multi-Type Content Management

**Parent Spec:** `spec.md` (R1 - Admin Console)
**Status:** Not Started
**Estimated Effort:** 2-3 days
**Dependencies:** Task 01 (Backend Foundation) complete

---

## References to Main Spec

- **Service Boundaries:** Section 2.1
- **Database Schema:** Section 3.1 (content_post table with enums)
- **API Contracts:** Section 4.2
- **Content Types:** News, Events, Videos, Recalls

---

## Objective

Build Content Service for managing:
1. Multi-type content posts (news, event, video, recall)
2. Draft/Published/Archived status workflow
3. Vehicle associations (link content to specific vehicles)
4. Slug generation for SEO-friendly URLs
5. Scheduled publishing

---

## Implementation Summary

### Database Schema

```sql
CREATE TYPE content_post_type AS ENUM ('news', 'event', 'video', 'recall');
CREATE TYPE content_post_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE content_post (
  id VARCHAR(36) PRIMARY KEY,
  type content_post_type NOT NULL,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(350) UNIQUE NOT NULL,
  body_md TEXT,
  excerpt TEXT,
  media TEXT[] DEFAULT '{}',
  vehicle_ids TEXT[] DEFAULT '{}',
  status content_post_status DEFAULT 'draft',
  publish_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### Prisma Schema

**Add to `prisma/schema.prisma`:**
```prisma
enum ContentPostType {
  news
  event
  video
  recall
}

enum ContentPostStatus {
  draft
  published
  archived
}

model ContentPost {
  id          String            @id @default(uuid())
  type        ContentPostType
  title       String            @db.VarChar(300)
  slug        String            @unique @db.VarChar(350)
  bodyMd      String?           @map("body_md") @db.Text
  excerpt     String?           @db.Text
  media       String[]          @default([])
  vehicleIds  String[]          @map("vehicle_ids") @default([])
  status      ContentPostStatus @default(draft)
  publishAt   DateTime?         @map("publish_at")

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  @@index([type], name: "idx_content_type")
  @@index([status], name: "idx_content_status")
  @@index([publishAt], name: "idx_content_publish")
  @@index([vehicleIds], name: "idx_content_vehicles")
  @@map("content_post")
}
```

### Contracts

**File: `libs/shared/contracts/src/content/content-post.ts`**
```typescript
import { z } from 'zod';

export const ContentPostTypeEnum = z.enum(['news', 'event', 'video', 'recall']);
export const ContentPostStatusEnum = z.enum(['draft', 'published', 'archived']);

export const CreateContentPostSchema = z.object({
  type: ContentPostTypeEnum,
  title: z.string().min(1).max(300),
  bodyMd: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  media: z.array(z.string().url()).default([]),
  vehicleIds: z.array(z.string().uuid()).default([]),
  status: ContentPostStatusEnum.default('draft'),
  publishAt: z.string().datetime().optional(),
});

export const UpdateContentPostSchema = CreateContentPostSchema.partial().extend({
  // Slug should not be updatable after creation
  slug: z.never().optional(),
});

export const ContentPostQuerySchema = z.object({
  type: ContentPostTypeEnum.optional(),
  status: ContentPostStatusEnum.optional(),
  vehicleId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const ContentPostSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('content.post#v1'),
  postType: ContentPostTypeEnum,
  title: z.string(),
  slug: z.string(),
  bodyMd: z.string().optional(),
  excerpt: z.string().optional(),
  media: z.array(z.string()),
  vehicleIds: z.array(z.string()),
  status: ContentPostStatusEnum,
  publishAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().optional(),
});

export type CreateContentPost = z.infer<typeof CreateContentPostSchema>;
export type UpdateContentPost = z.infer<typeof UpdateContentPostSchema>;
export type ContentPostQuery = z.infer<typeof ContentPostQuerySchema>;
export type ContentPost = z.infer<typeof ContentPostSchema>;
export type ContentPostType = z.infer<typeof ContentPostTypeEnum>;
export type ContentPostStatus = z.infer<typeof ContentPostStatusEnum>;
```

### Key Domain Logic

**Slug Generation Utility:**
```typescript
// apps/motorghar/svc-content/src/utils/slug.ts
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .substring(0, 300);        // Limit length
}

export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
```

**Publishing Logic in Entity:**
```typescript
// apps/motorghar/svc-content/src/domain/entities/content-post.entity.ts
export class ContentPostEntity extends Entity<ContentPostProps> {
  // ... other methods

  publish(publishAt?: Date) {
    this.props.status = 'published';
    this.props.publishAt = publishAt || new Date();
    this.touch();
  }

  archive() {
    this.props.status = 'archived';
    this.touch();
  }

  draft() {
    this.props.status = 'draft';
    this.touch();
  }

  get isPublished(): boolean {
    return this.props.status === 'published' &&
           (!this.props.publishAt || this.props.publishAt <= new Date());
  }

  linkToVehicle(vehicleId: string) {
    if (!this.props.vehicleIds.includes(vehicleId)) {
      this.props.vehicleIds.push(vehicleId);
      this.touch();
    }
  }

  unlinkFromVehicle(vehicleId: string) {
    this.props.vehicleIds = this.props.vehicleIds.filter(id => id !== vehicleId);
    this.touch();
  }
}
```

### File Structure

```
apps/motorghar/svc-content/
├── src/
│   ├── domain/
│   │   ├── entities/content-post.entity.ts
│   │   └── events/content.events.ts
│   ├── ports/repositories/content-post.repository.ts
│   ├── adapters/db/content-post.repository.impl.ts
│   ├── app/use-cases/
│   │   ├── create-post.ts
│   │   ├── list-posts.ts
│   │   ├── get-post.ts
│   │   ├── update-post.ts
│   │   ├── delete-post.ts
│   │   ├── publish-post.ts
│   │   └── archive-post.ts
│   ├── controllers/content.controller.ts
│   ├── utils/slug.ts
│   ├── config/
│   ├── app.ts
│   └── main.ts
```

### API Endpoints

```
POST   /posts              Create content post (auto-generate slug)
GET    /posts              List posts (filter by type, status, vehicleId)
GET    /posts/:id          Get post by ID
GET    /posts/slug/:slug   Get post by slug (for public consumption)
PATCH  /posts/:id          Update post
DELETE /posts/:id          Soft-delete post
POST   /posts/:id/publish  Publish post (change status to published)
POST   /posts/:id/archive  Archive post
```

### Special Repository Queries

```typescript
interface ContentPostRepository {
  // ... CRUD methods
  findBySlug(slug: string): Promise<ContentPostEntity | null>;
  findByVehicleId(vehicleId: string, published: boolean): Promise<ContentPostEntity[]>;
  findPublished(type?: ContentPostType): Promise<ContentPostEntity[]>;
  findScheduledForPublishing(before: Date): Promise<ContentPostEntity[]>;
}
```

---

## Testing

### Unit Test - Slug Generation
```typescript
describe('Slug generation', () => {
  it('should generate slug from title', () => {
    expect(generateSlug('Honda CBR250R Review 2024')).toBe('honda-cbr250r-review-2024');
  });

  it('should handle special characters', () => {
    expect(generateSlug('Top 10 Bikes @ Nepal (2024)!')).toBe('top-10-bikes-nepal-2024');
  });

  it('should ensure uniqueness', () => {
    const existing = ['honda-cbr250r', 'honda-cbr250r-1'];
    expect(ensureUniqueSlug('honda-cbr250r', existing)).toBe('honda-cbr250r-2');
  });
});
```

### Integration Test - Publishing Workflow
```typescript
describe('POST /posts/:id/publish', () => {
  it('should publish draft post', async () => {
    // Create draft
    const createRes = await app.inject({
      method: 'POST',
      url: '/posts',
      payload: {
        type: 'news',
        title: 'New Honda Launch',
        status: 'draft',
      },
    });

    const postId = JSON.parse(createRes.body).data.id;

    // Publish
    const publishRes = await app.inject({
      method: 'POST',
      url: `/posts/${postId}/publish`,
    });

    expect(publishRes.statusCode).toBe(200);
    const body = JSON.parse(publishRes.body);
    expect(body.data.status).toBe('published');
    expect(body.data.publishAt).toBeDefined();
  });
});
```

---

## Acceptance Criteria

- [ ] Content post table created with enums
- [ ] Service starts on port 3002
- [ ] Can create all 4 types of content (news, event, video, recall)
- [ ] Slugs auto-generated from title
- [ ] Slug uniqueness enforced
- [ ] Can filter by type, status, vehicleId
- [ ] Can publish, archive, draft posts
- [ ] Scheduled publishing (publishAt) respected in queries
- [ ] Vehicle associations work correctly
- [ ] Domain events logged
- [ ] Unit tests pass (80%+ coverage)
- [ ] Integration tests pass

---

## Commands

```bash
npx prisma migrate dev --name add_content_post_table
npx nx build svc-content
npx nx test svc-content
npx nx serve svc-content

# Test
curl -X POST http://localhost:3002/posts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "news",
    "title": "Honda Launches New CBR500R in Nepal",
    "bodyMd": "# Exciting News\n\nHonda has launched...",
    "status": "published"
  }'
```

---

## Next Steps

After completion:
1. Commit: `feat(R1): add content service with multi-type posts`
2. Proceed to Task 05: Review Moderation
/**
 * Content Service Contracts
 */

import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const CreateContentPostReq = z.object({
  type: z.enum(['news', 'event', 'video', 'recall']),
  title: z.string().min(1).max(300),
  bodyMd: z.string().min(1),
  vehicleIds: z.array(z.string().uuid()).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  publishAt: z.string().datetime().optional(),
});

export const UpdateContentPostReq = CreateContentPostReq.partial();

// ============================================================================
// Response Schemas
// ============================================================================

export const ContentPostRes = z.object({
  id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  bodyMd: z.string(),
  vehicleIds: z.array(z.string()),
  status: z.string(),
  publishAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const ListContentPostsQuery = z.object({
  type: z.enum(['news', 'event', 'video', 'recall']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  vehicleId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// Type exports
// ============================================================================

export type CreateContentPostReq = z.infer<typeof CreateContentPostReq>;
export type UpdateContentPostReq = z.infer<typeof UpdateContentPostReq>;
export type ContentPostRes = z.infer<typeof ContentPostRes>;
export type ListContentPostsQuery = z.infer<typeof ListContentPostsQuery>;
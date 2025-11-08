/**
 * Garage Service Contracts (Owner Vehicles)
 */

import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const CreateOwnerVehicleReq = z.object({
  userId: z.string().min(1).max(100),
  catalogId: z.string().uuid(),
  nickname: z.string().max(200).optional(),
  odoKm: z.number().int().min(0).optional(),
  fieldsJsonb: z.record(z.string(), z.any()).default({}),
});

export const UpdateOwnerVehicleReq = CreateOwnerVehicleReq.partial().omit({
  userId: true,
  catalogId: true,
});

export const CreateOwnerVehicleNoteReq = z.object({
  ownerVehicleId: z.string().uuid(),
  body: z.string().min(1),
});

export const CreateOwnerVehicleMediaReq = z.object({
  ownerVehicleId: z.string().uuid(),
  url: z.string().url().max(500),
  kind: z.enum(['image', 'video']),
});

export const CreateOwnerVehicleReviewReq = z.object({
  ownerVehicleId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const OwnerVehicleRes = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  catalogId: z.string().uuid(),
  nickname: z.string().nullable(),
  odoKm: z.number().nullable(),
  fieldsJsonb: z.record(z.string(), z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const OwnerVehicleNoteRes = z.object({
  id: z.string().uuid(),
  ownerVehicleId: z.string().uuid(),
  body: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const OwnerVehicleMediaRes = z.object({
  id: z.string().uuid(),
  ownerVehicleId: z.string().uuid(),
  url: z.string(),
  kind: z.string(),
  createdAt: z.string().datetime(),
});

export const OwnerVehicleReviewRes = z.object({
  id: z.string().uuid(),
  ownerVehicleId: z.string().uuid(),
  rating: z.number(),
  comment: z.string().nullable(),
  approved: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const ListOwnerVehiclesQuery = z.object({
  userId: z.string(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// Type exports
// ============================================================================

export type CreateOwnerVehicleReq = z.infer<typeof CreateOwnerVehicleReq>;
export type UpdateOwnerVehicleReq = z.infer<typeof UpdateOwnerVehicleReq>;
export type CreateOwnerVehicleNoteReq = z.infer<
  typeof CreateOwnerVehicleNoteReq
>;
export type CreateOwnerVehicleMediaReq = z.infer<
  typeof CreateOwnerVehicleMediaReq
>;
export type CreateOwnerVehicleReviewReq = z.infer<
  typeof CreateOwnerVehicleReviewReq
>;
export type OwnerVehicleRes = z.infer<typeof OwnerVehicleRes>;
export type OwnerVehicleNoteRes = z.infer<typeof OwnerVehicleNoteRes>;
export type OwnerVehicleMediaRes = z.infer<typeof OwnerVehicleMediaRes>;
export type OwnerVehicleReviewRes = z.infer<typeof OwnerVehicleReviewRes>;
export type ListOwnerVehiclesQuery = z.infer<typeof ListOwnerVehiclesQuery>;

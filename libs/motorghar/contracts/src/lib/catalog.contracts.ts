/**
 * Vehicle Catalog Service Contracts
 */

import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const CreateVehicleCatalogReq = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(2100),
  trim: z.string().min(1).max(100),
  fuelType: z.string().max(50).optional(),
  specsJsonb: z.record(z.string(), z.any()).default({}),
});

export const UpdateVehicleCatalogReq = CreateVehicleCatalogReq.partial();

export const CreateVehicleCatalogMediaReq = z.object({
  catalogId: z.string().uuid(),
  url: z.string().url().max(500),
  kind: z.enum(['image', 'video']),
  order: z.number().int().default(0),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const VehicleCatalogRes = z.object({
  id: z.string().uuid(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  trim: z.string(),
  fuelType: z.string().nullable(),
  specsJsonb: z.record(z.string(), z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const VehicleCatalogMediaRes = z.object({
  id: z.string().uuid(),
  catalogId: z.string().uuid(),
  url: z.string(),
  kind: z.string(),
  order: z.number(),
  createdAt: z.string().datetime(),
});

export const VehicleCatalogWithMediaRes = VehicleCatalogRes.extend({
  media: z.array(VehicleCatalogMediaRes),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const ListVehicleCatalogQuery = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// Type exports
// ============================================================================

export type CreateVehicleCatalogReq = z.infer<typeof CreateVehicleCatalogReq>;
export type UpdateVehicleCatalogReq = z.infer<typeof UpdateVehicleCatalogReq>;
export type CreateVehicleCatalogMediaReq = z.infer<
  typeof CreateVehicleCatalogMediaReq
>;
export type VehicleCatalogRes = z.infer<typeof VehicleCatalogRes>;
export type VehicleCatalogMediaRes = z.infer<typeof VehicleCatalogMediaRes>;
export type VehicleCatalogWithMediaRes = z.infer<
  typeof VehicleCatalogWithMediaRes
>;
export type ListVehicleCatalogQuery = z.infer<typeof ListVehicleCatalogQuery>;

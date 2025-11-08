/**
 * Service Center Service Contracts
 */

import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const CreateServiceCenterReq = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const UpdateServiceCenterReq = CreateServiceCenterReq.partial();

export const CreateServiceAppointmentReq = z.object({
  ownerVehicleId: z.string().uuid(),
  centerId: z.string().uuid(),
  slotTs: z.string().datetime(),
  notes: z.string().optional(),
});

export const UpdateServiceAppointmentReq = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  notes: z.string().optional(),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const ServiceCenterRes = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ServiceAppointmentRes = z.object({
  id: z.string().uuid(),
  ownerVehicleId: z.string().uuid(),
  centerId: z.string().uuid(),
  slotTs: z.string().datetime(),
  status: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const FindNearbyCentersQuery = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(100).default(10),
});

export const ListAppointmentsQuery = z.object({
  ownerVehicleId: z.string().uuid().optional(),
  centerId: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// Type exports
// ============================================================================

export type CreateServiceCenterReq = z.infer<typeof CreateServiceCenterReq>;
export type UpdateServiceCenterReq = z.infer<typeof UpdateServiceCenterReq>;
export type CreateServiceAppointmentReq = z.infer<
  typeof CreateServiceAppointmentReq
>;
export type UpdateServiceAppointmentReq = z.infer<
  typeof UpdateServiceAppointmentReq
>;
export type ServiceCenterRes = z.infer<typeof ServiceCenterRes>;
export type ServiceAppointmentRes = z.infer<typeof ServiceAppointmentRes>;
export type FindNearbyCentersQuery = z.infer<typeof FindNearbyCentersQuery>;
export type ListAppointmentsQuery = z.infer<typeof ListAppointmentsQuery>;
/**
 * Branded ID types for type safety
 *
 * Example usage:
 *   const vehicleId: VehicleId = 'abc-123' as VehicleId;
 *   const userId: UserId = 'xyz-456' as UserId;
 *
 *   // TypeScript prevents mixing different ID types:
 *   function getVehicle(id: VehicleId) { ... }
 *   getVehicle(userId); // ❌ Type error!
 */

// Brand type helper
declare const brand: unique symbol;
type Brand<T, TBrand> = T & { [brand]: TBrand };

// Domain entity IDs
export type VehicleId = Brand<string, 'VehicleId'>;
export type OwnerVehicleId = Brand<string, 'OwnerVehicleId'>;
export type ServiceCenterId = Brand<string, 'ServiceCenterId'>;
export type AppointmentId = Brand<string, 'AppointmentId'>;
export type ContentPostId = Brand<string, 'ContentPostId'>;
export type UserId = Brand<string, 'UserId'>;

// R1 Spec - Additional branded IDs
export type CatalogId = Brand<string, 'CatalogId'>;
export type VariantId = Brand<string, 'VariantId'>;
export type CenterId = Brand<string, 'CenterId'>;
export type ContentId = Brand<string, 'ContentId'>;
export type ReviewId = Brand<string, 'ReviewId'>;

// R1 Spec - Helper functions for creating branded IDs
export function catalogId(id: string): CatalogId {
  return id as CatalogId;
}

export function variantId(id: string): VariantId {
  return id as VariantId;
}

export function centerId(id: string): CenterId {
  return id as CenterId;
}

export function contentId(id: string): ContentId {
  return id as ContentId;
}

export function reviewId(id: string): ReviewId {
  return id as ReviewId;
}

export function userId(id: string): UserId {
  return id as UserId;
}

export function ownerVehicleId(id: string): OwnerVehicleId {
  return id as OwnerVehicleId;
}

// Helper to create branded IDs (with runtime validation)
export function createBrandedId<T extends string>(
  value: string,
  _brand: T
): Brand<string, T> {
  if (!value || value.trim().length === 0) {
    throw new Error(`Invalid ID: ${value}`);
  }
  return value as Brand<string, T>;
}

// UUID validation helper
export function isValidUuid(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
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
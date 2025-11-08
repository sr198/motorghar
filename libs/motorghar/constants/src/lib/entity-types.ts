/**
 * Domain entity type identifiers
 * Used in outbox pattern and event sourcing
 */

export const ENTITY_TYPES = {
  VEHICLE_CATALOG: 'vehicle.catalog#v1',
  VEHICLE_OWNER: 'vehicle.owner#v1',
  SERVICE_CENTER: 'service.center#v1',
  SERVICE_APPOINTMENT: 'service.appointment#v1',
  CONTENT_POST: 'content.post#v1',
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];
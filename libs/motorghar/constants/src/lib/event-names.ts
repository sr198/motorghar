/**
 * Domain event names following the pattern: {Entity}{Action}#v{Version}
 * Used for event-driven architecture and outbox pattern
 */

export const DOMAIN_EVENTS = {
  // Vehicle Catalog Events
  CATALOG_VEHICLE_CREATED: 'CatalogVehicleCreated#v1',
  CATALOG_VEHICLE_UPDATED: 'CatalogVehicleUpdated#v1',
  CATALOG_VEHICLE_DELETED: 'CatalogVehicleDeleted#v1',

  // Owner Vehicle Events
  VEHICLE_OWNER_ADDED: 'VehicleOwnerAdded#v1',
  VEHICLE_OWNER_UPDATED: 'VehicleOwnerUpdated#v1',
  VEHICLE_OWNER_DELETED: 'VehicleOwnerDeleted#v1',
  VEHICLE_NOTE_ADDED: 'VehicleNoteAdded#v1',
  VEHICLE_MEDIA_ADDED: 'VehicleMediaAdded#v1',
  VEHICLE_REVIEW_SUBMITTED: 'VehicleReviewSubmitted#v1',
  VEHICLE_REVIEW_APPROVED: 'VehicleReviewApproved#v1',

  // Service Center Events
  SERVICE_CENTER_CREATED: 'ServiceCenterCreated#v1',
  SERVICE_CENTER_UPDATED: 'ServiceCenterUpdated#v1',

  // Appointment Events
  APPOINTMENT_CREATED: 'AppointmentCreated#v1',
  APPOINTMENT_CONFIRMED: 'AppointmentConfirmed#v1',
  APPOINTMENT_CANCELLED: 'AppointmentCancelled#v1',
  APPOINTMENT_COMPLETED: 'AppointmentCompleted#v1',

  // Content Events
  CONTENT_POST_CREATED: 'ContentPostCreated#v1',
  CONTENT_POST_PUBLISHED: 'ContentPostPublished#v1',
  CONTENT_POST_UPDATED: 'ContentPostUpdated#v1',
} as const;

export type DomainEventName =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];
/**
 * Common enums used across the application
 */

// Content types (R1 Spec)
export enum ContentType {
  News = 'news',
  Event = 'event',
  Video = 'video',
  Recall = 'recall',
}

export enum ContentPostType {
  NEWS = 'news',
  EVENT = 'event',
  VIDEO = 'video',
  RECALL = 'recall',
}

// Content status (R1 Spec)
export enum ContentStatus {
  Draft = 'draft',
  Published = 'published',
}

export enum ContentPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// Entity types (R1 Spec)
export enum EntityType {
  VEHICLE_CATALOG = 'vehicle.catalog#v1',
  VEHICLE_VARIANT = 'vehicle.variant#v1',
  SERVICE_CENTER = 'service.center#v1',
  CONTENT_POST = 'content.post#v1',
  OWNER_VEHICLE_REVIEW = 'owner.vehicle.review#v1',
}

// Media kinds
export enum MediaKind {
  Image = 'image',
  Video = 'video',
}

// Appointment status
export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

// Fuel types
export enum FuelType {
  Petrol = 'petrol',
  Diesel = 'diesel',
  Electric = 'electric',
  Hybrid = 'hybrid',
  CNG = 'cng',
}

// Log levels
export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

// Environment
export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}
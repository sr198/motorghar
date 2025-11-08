/**
 * Common enums used across the application
 */

// Content types
export enum ContentType {
  News = 'news',
  Event = 'event',
  Video = 'video',
  Recall = 'recall',
}

// Content status
export enum ContentStatus {
  Draft = 'draft',
  Published = 'published',
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
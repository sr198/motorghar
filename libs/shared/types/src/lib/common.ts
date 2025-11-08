/**
 * Common utility types
 */

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Timestamps
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDelete {
  deletedAt: Date | null;
}

// Coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Result type (for error handling)
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Make all properties optional (Partial) and nullable
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Pick properties that are required
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// Pick properties that are optional
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
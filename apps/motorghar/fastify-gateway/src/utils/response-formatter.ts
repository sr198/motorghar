import { randomUUID } from 'crypto';
import { SuccessResponse, ListResponse, ErrorResponse } from '@motorghar/contracts';

export function formatSuccess<T>(data: T, requestId?: string): SuccessResponse<T> {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || randomUUID(),
    },
  };
}

export function formatList<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number,
  requestId?: string
): ListResponse<T> {
  return {
    data,
    meta: {
      total,
      limit,
      offset,
      timestamp: new Date().toISOString(),
      requestId: requestId || randomUUID(),
    },
  };
}

export function formatError(
  code: string,
  message: string,
  details?: Array<{ field?: string; message: string; code?: string }>,
  requestId?: string
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || randomUUID(),
    },
  };
}
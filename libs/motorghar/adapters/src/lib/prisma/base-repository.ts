/**
 * Base Repository using Prisma
 * Provides common CRUD operations
 */

import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  constructor(protected readonly prisma: PrismaClient) {}

  /**
   * Find entity by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find all entities (with optional filtering)
   */
  abstract findAll(filter?: unknown): Promise<T[]>;

  /**
   * Create new entity
   */
  abstract create(data: unknown): Promise<T>;

  /**
   * Update existing entity
   */
  abstract update(id: string, data: unknown): Promise<T>;

  /**
   * Soft delete entity (if supported)
   */
  abstract softDelete(id: string): Promise<T>;

  /**
   * Hard delete entity
   */
  abstract delete(id: string): Promise<void>;
}
/**
 * ID prefixes for different entity types
 * Useful for creating human-readable, type-identifiable IDs
 *
 * Example: vcat_550e8400-e29b-41d4-a716-446655440000
 */

export const ID_PREFIXES = {
  VEHICLE_CATALOG: 'vcat',
  VEHICLE_OWNER: 'vown',
  VEHICLE_NOTE: 'vnot',
  VEHICLE_MEDIA: 'vmed',
  VEHICLE_REVIEW: 'vrev',
  SERVICE_CENTER: 'scen',
  SERVICE_APPOINTMENT: 'sapt',
  CONTENT_POST: 'post',
  USER: 'user',
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

/**
 * Create a prefixed ID
 * @param prefix - The ID prefix
 * @param uuid - The UUID to prefix
 * @returns Prefixed ID string
 */
export function createPrefixedId(prefix: IdPrefix, uuid: string): string {
  return `${prefix}_${uuid}`;
}

/**
 * Extract UUID from prefixed ID
 * @param prefixedId - The prefixed ID
 * @returns UUID string
 */
export function extractUuid(prefixedId: string): string {
  const parts = prefixedId.split('_');
  return parts.length > 1 ? parts.slice(1).join('_') : prefixedId;
}

/**
 * Get prefix from prefixed ID
 * @param prefixedId - The prefixed ID
 * @returns Prefix string or null
 */
export function getPrefix(prefixedId: string): string | null {
  const parts = prefixedId.split('_');
  return parts.length > 1 ? parts[0] : null;
}
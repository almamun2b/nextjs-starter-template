/**
 * Normalize an enum value into a string.
 *
 * Works with both numeric and string enums, returning a
 * consistent string form (or `undefined` if null/undefined).
 *
 * @template T - Enum object type
 * @param {T} enumObj - The enum object
 * @param {T[keyof T] | string | null | undefined} value - Enum value
 * @returns {string | undefined} Normalized string or undefined
 *
 * @example
 * enum Status { Active, Inactive }
 * normalizeEnumValue(Status, Status.Active) // "Active"
 * normalizeEnumValue(Status, 1)             // "Inactive"
 *
 * enum Role { Admin = "ADMIN", User = "USER" }
 * normalizeEnumValue(Role, Role.Admin) // "ADMIN"
 */
const normalizeEnumValue = <T extends Record<string, string | number>>(
  enumObj: T,
  value: T[keyof T] | string | null | undefined
): string | undefined => {
  if (value === null || value === undefined) return undefined
  return typeof value === 'number' ? String(enumObj[value]) : value
}

export { normalizeEnumValue }

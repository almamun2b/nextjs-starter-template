/**
 * The API sends/receives numeric TS enums (e.g. `UserRole`, `UserStatus`,
 * `Gender`) by their string key (e.g. `"ADMIN"`), not their numeric value.
 * Reads from the API can still arrive as the numeric value depending on the
 * source, so this normalizes either representation to the string key.
 */
const normalizeEnumValue = <T extends Record<string, string | number>>(
  enumObj: T,
  value: T[keyof T] | string | null | undefined
): string | undefined => {
  if (value === null || value === undefined) return undefined
  return typeof value === 'number' ? String(enumObj[value]) : value
}

export { normalizeEnumValue }

import type { Primitive, QueryParamValue, QueryParams } from './types'

/**
 * Serializes a single {@link Primitive} value to its query-string
 * representation, or `null` if it should be omitted entirely.
 */
function serializePrimitive(value: Primitive): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean' || typeof value === 'number')
    return String(value)
  return value
}

/**
 * Converts a {@link QueryParams} map into a `URLSearchParams` instance.
 *
 * - `null`/`undefined` values (and array items) are omitted.
 * - Array values are serialized as repeated keys, e.g. `{ tag: ['a', 'b'] }` → `?tag=a&tag=b`.
 *
 * @param params - The params to serialize. Omit/undefined yields an empty `URLSearchParams`.
 */
export function serializeParams(params?: QueryParams): URLSearchParams {
  const searchParams = new URLSearchParams()

  if (!params) return searchParams

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue

    if (Array.isArray(value)) {
      for (const item of value) {
        const serialized = serializePrimitive(item)
        if (serialized !== null) searchParams.append(key, serialized)
      }
      continue
    }

    const serialized = serializePrimitive(value as QueryParamValue as Primitive)
    if (serialized !== null) searchParams.append(key, serialized)
  }

  return searchParams
}

/**
 * Determines whether `value` should be treated as a plain, JSON-serializable
 * object/array rather than passed through untouched to `fetch` as a native
 * `BodyInit` (FormData, Blob, ArrayBuffer, typed array, URLSearchParams,
 * ReadableStream).
 */
function isPlainSerializable(
  value: unknown
): value is Record<string, unknown> | unknown[] {
  if (value === null || typeof value !== 'object') return false

  if (Array.isArray(value)) return true

  if (
    value instanceof FormData ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    value instanceof URLSearchParams ||
    (typeof ReadableStream !== 'undefined' &&
      value instanceof ReadableStream) ||
    ArrayBuffer.isView(value)
  ) {
    return false
  }

  return true
}

/**
 * Serializes a request body for the native `fetch` call.
 *
 * - `null`/`undefined` → passed through as-is (no body sent).
 * - `string` → passed through as-is.
 * - Native `BodyInit` values (FormData, Blob, ArrayBuffer, typed arrays,
 *   URLSearchParams, ReadableStream) → passed through untouched, and no
 *   `Content-Type` is set (left to the runtime, important for correct
 *   multipart boundaries).
 * - Plain objects/arrays → `JSON.stringify`-ed, and `Content-Type:
 *   application/json` is set unless the caller already provided one.
 *
 * @param body - The raw body value provided to `$fetch`.
 * @param headers - The request `Headers`, mutated in-place with a `Content-Type` when JSON-serializing.
 * @returns The serialized body and the (possibly updated) headers.
 */
export function serializeBody(
  body: unknown,
  headers: Headers
): { body: BodyInit | null | undefined; headers: Headers } {
  if (body === null || body === undefined) {
    return { body: body as null | undefined, headers }
  }

  if (typeof body === 'string') {
    return { body, headers }
  }

  if (isPlainSerializable(body)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    return { body: JSON.stringify(body), headers }
  }

  return { body: body as BodyInit, headers }
}

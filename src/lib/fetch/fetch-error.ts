import type { FetchResponse } from './types'

/**
 * Error thrown by `$fetch` whenever the underlying HTTP response resolves
 * with `ok === false`. Carries the full parsed {@link FetchResponse} shape
 * (status, headers, parsed `data`, ...) as direct properties so callers can
 * inspect the failure without re-parsing the response.
 *
 * Network-level failures (DNS errors, aborts, etc.) are *not* wrapped in a
 * `FetchError` — those propagate as the original native error, unmodified.
 *
 * @typeParam TResponse - Shape of the parsed response body (`data`).
 *
 * @example
 * ```ts
 * try {
 *   await $fetch('/api/orders/999')
 * } catch (error) {
 *   if (error instanceof FetchError) {
 *     console.log(error.status, error.data)
 *   }
 * }
 * ```
 */
export class FetchError<TResponse = unknown> extends Error {
  /** The raw, untouched `Response` object. */
  response: Response
  status: number
  statusText: string
  ok: boolean
  url: string
  headers: Headers
  /** Parsed response body, or `null` if it couldn't be determined. */
  data: TResponse | null

  /**
   * @param result - The parsed {@link FetchResponse} describing the failed request.
   * @param options.cause - Optional underlying error to attach via the standard `Error.cause` chain.
   */
  constructor(result: FetchResponse<TResponse>, options?: { cause?: unknown }) {
    super(
      result.message ??
        result.statusText ??
        `Request failed with status ${result.status}`
    )

    this.name = 'FetchError'
    this.response = result.response
    this.status = result.status
    this.statusText = result.statusText
    this.ok = result.ok
    this.url = result.url
    this.headers = result.headers
    this.data = (result.data ?? null) as TResponse | null

    if (options?.cause) {
      this.cause = options.cause
    }

    // Node-only helper for a cleaner stack trace; guarded since it's absent in edge/browser runtimes.
    const captureStackTrace = (
      Error as { captureStackTrace?: (target: object, ctor: unknown) => void }
    ).captureStackTrace
    if (typeof captureStackTrace === 'function') {
      captureStackTrace(this, FetchError)
    }
  }
}

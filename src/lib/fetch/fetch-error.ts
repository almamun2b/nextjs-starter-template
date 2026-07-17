import type { FetchResponse } from './types'

/**
 * Error thrown by `$fetch` whenever the underlying HTTP response resolves
 * with `ok === false`. Carries the full parsed {@link FetchResponse} shape
 * (status, parsed `data`, ...) as direct properties so callers can
 * inspect the failure without re-parsing the response.
 *
 * Network-level failures (DNS errors, aborts, etc.) are *not* wrapped in a
 * `FetchError` — those propagate as the original native error, unmodified.
 *
 * @typeParam TResponse - Shape of the parsed response body (`data`).
 *
 * @example
 * ```ts
 * import { $fetch, FetchError } from '@/lib/fetch'
 * import type { TUserResponse } from '@/types/user.types'
 *
 * try {
 *   await $fetch.get<TUserResponse>(`/users/${id}`)
 * } catch (error) {
 *   if (error instanceof FetchError) {
 *     console.log(error.status)   // e.g. 404
 *     console.log(error.data)     // parsed body, e.g. { message: 'User not found' }
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
    this.data = result.data ?? null

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

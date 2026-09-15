/**
 * What went wrong, so callers can branch without sniffing native errors:
 * - `http` — a response arrived with `ok === false` (`status`/`data` are set).
 * - `network` — no usable response: DNS, refused connection, reset socket, ...
 * - `timeout` — the `timeout` option elapsed before the response was read.
 * - `abort` — the caller's own `signal` aborted the request.
 * - `parse` — a successful response's body could not be parsed as declared.
 */
export type FetchErrorKind = 'http' | 'network' | 'timeout' | 'abort' | 'parse'

/** The request a {@link FetchError} belongs to. Never includes headers or body. */
export interface FetchErrorRequest {
  method: string
  url: string
}

export interface FetchErrorInit<TData = unknown> {
  kind: FetchErrorKind
  request: FetchErrorRequest
  response?: Response | null
  data?: TData | null
  message?: string | null
  cause?: unknown
}

const DEFAULT_MESSAGES: Record<FetchErrorKind, string> = {
  http: 'Request failed',
  network: 'Network request failed',
  timeout: 'Request timed out',
  abort: 'Request was aborted',
  parse: 'Could not parse the response body',
}

/**
 * The single error type thrown by `$fetch`, for HTTP failures *and*
 * transport failures — see {@link FetchErrorKind}.
 *
 * @typeParam TData - Shape of the parsed *error* body (`data`), which is
 * usually different from the success body type.
 *
 * @example
 * ```ts
 * try {
 *   await api.get<TUserResponse>(`/users/${encodeURIComponent(id)}`)
 * } catch (error) {
 *   if (isHttpError(error) && error.status === 404) notFound()
 *   if (isTimeoutError(error)) return serviceUnavailable()
 *   throw error
 * }
 * ```
 */
export class FetchError<TData = unknown> extends Error {
  readonly kind: FetchErrorKind
  readonly request: FetchErrorRequest
  /** The response, when one arrived (`http`/`parse`). Its body has already been read. */
  readonly response: Response | null
  /** HTTP status, or `0` when no response arrived. */
  readonly status: number
  readonly statusText: string
  readonly ok: boolean
  /** Final response URL (after redirects), or the request URL when no response arrived. */
  readonly url: string
  /** Parsed response body, or `null` if there was none. */
  readonly data: TData | null

  constructor(init: FetchErrorInit<TData>) {
    const { kind, request, response = null } = init
    super(
      // `||`, not `??`: HTTP/2 responses carry an empty-string statusText.
      init.message ||
        (kind === 'http' && response
          ? response.statusText ||
            `Request failed with status ${response.status}`
          : DEFAULT_MESSAGES[kind]),
      init.cause === undefined ? undefined : { cause: init.cause }
    )

    this.name = 'FetchError'
    this.kind = kind
    this.request = request
    this.response = response
    this.status = response?.status ?? 0
    this.statusText = response?.statusText ?? ''
    this.ok = response?.ok ?? false
    this.url = response?.url || request.url
    this.data = init.data ?? null
  }
}

export const isFetchError = <TData = unknown>(
  error: unknown
): error is FetchError<TData> => error instanceof FetchError

export const isHttpError = <TData = unknown>(
  error: unknown
): error is FetchError<TData> => isFetchError(error) && error.kind === 'http'

export const isTimeoutError = (error: unknown): error is FetchError =>
  isFetchError(error) && error.kind === 'timeout'

export const isNetworkError = (error: unknown): error is FetchError =>
  isFetchError(error) && error.kind === 'network'

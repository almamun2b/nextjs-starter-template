type Primitive = string | number | boolean | null | undefined
type QueryParamValue = Primitive | Primitive[]

/**
 * Supported HTTP methods.
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

/**
 * A record of URL query parameters.
 * Values can be primitives or arrays of primitives — arrays are serialised
 * as repeated keys: `{ ids: [1, 2] }` → `?ids=1&ids=2`.
 */
export type QueryParams = Record<string, QueryParamValue>

/**
 * Next.js App Router caching extensions mirroring the `next` property
 * that Next.js adds to `RequestInit`.
 */
export interface NextOptions {
  /**
   * ISR revalidation window in seconds.
   * Pass `false` to opt out of caching entirely (`cache: 'no-store'`).
   */
  revalidate?: number | false
  /**
   * Cache tags for on-demand revalidation via `revalidateTag()`.
   * @example ['posts', `post-${id}`]
   */
  tags?: string[]
}

/**
 * Per-request configuration passed to every `$fetch` method.
 *
 * Extends `Omit<RequestInit, 'body' | 'method'>` so every native `fetch`
 * option (`credentials`, `mode`, `redirect`, `keepalive`, `integrity`, etc.)
 * is available automatically, now and in the future.
 *
 * `body` and `method` are omitted because `$fetch` manages them internally —
 * `body` is replaced with a generic `TBody` and `method` is derived from the
 * HTTP verb method you call (`.get()`, `.post()`, etc.).
 *
 * @template TBody Shape of the request body. Defaults to `unknown`.
 *
 * @example
 * await api.get('/users', {
 *   credentials: 'include',
 *   mode: 'cors',
 *   cache: 'no-store',
 *   params: { page: 1 },
 * })
 */
export interface FetchOptions<
  TBody = unknown,
  TParams extends QueryParams = QueryParams,
> extends Omit<RequestInit, 'body' | 'method'> {
  /**
   * URL query parameters serialised and appended to the URL automatically.
   * Arrays are expanded as repeated keys.
   */
  params?: TParams
  /**
   * Request body.
   * - Plain objects / arrays → `JSON.stringify` + `Content-Type: application/json`
   * - `FormData` / `URLSearchParams` → sent as-is (runtime sets `Content-Type`)
   * - `Blob` / `ArrayBuffer` / `ArrayBufferView` / `string` → passed through unchanged
   */
  body?: TBody
  /**
   * Overrides the instance-level `baseURL` for this single request.
   */
  baseURL?: string
  /**
   * Request timeout in milliseconds. Aborts the request and throws a
   * `FetchError` with `isTimeout === true` when exceeded.
   */
  timeout?: number
  /**
   * Next.js App Router caching options (`revalidate`, `tags`).
   * Merged with instance-level `next` options (per-request wins on conflict).
   */
  next?: NextOptions
}

/**
 * The normalised response returned by every `$fetch` method.
 *
 * @template TData Expected shape of the parsed response body.
 */
export interface FetchResponse<TData = unknown> {
  /** Parsed response body. `undefined` for 204 / empty responses. */
  data: TData
  /** HTTP status code. */
  status: number
  /** HTTP status text, e.g. `"OK"` or `"Not Found"`. */
  statusText: string
  /** Raw response headers. */
  headers: Headers
  /** `true` when `status` is in the 200–299 range. */
  ok: boolean
}

/**
 * The fully-resolved request object passed into `onRequest`.
 * All options are merged, the URL is built, and `init` is ready
 * to be handed directly to `fetch()`.
 */
export interface ResolvedRequest {
  /** Fully-qualified URL including query string. */
  url: string
  /** HTTP method that will be used. */
  method: HttpMethod
  /**
   * Complete `RequestInit` (plus Next.js `next` extension) that will be
   * passed to the underlying `fetch()` call. Mutate freely inside the hook.
   */
  init: RequestInit & { next?: NextOptions }
}

/**
 * Four focused lifecycle hooks — one per stage, zero overlap.
 *
 * Execution order:
 * ```
 * onRequest → fetch() → onResponse → onSuccess
 *                           ↓ (non-2xx / network / timeout)
 *                        onError → throw
 * ```
 *
 * @example
 * const api = createFetch({
 *   interceptors: {
 *     onRequest: (req) => {
 *       req.init.headers['Authorization'] = `Bearer ${getToken()}`
 *       return req
 *     },
 *     onResponse: (res) => {
 *       logger.info({ status: res.status, ok: res.ok })
 *       return res
 *     },
 *     onSuccess: (res) => {
 *       return { ...res, data: (res.data as ApiEnvelope<unknown>).payload }
 *     },
 *     onError: (err) => {
 *       Sentry.captureException(err)
 *       if (err.status === 401) router.push('/login')
 *       throw err
 *     },
 *   },
 * })
 */
export interface Interceptors {
  /**
   * Runs immediately before `fetch()`, after all options are merged and the
   * URL is fully built. The only stage where the outgoing request can still
   * be mutated — attach auth tokens, inject trace IDs, or log the request.
   *
   * Must return the `ResolvedRequest` (modified or unchanged).
   *
   * @param request Fully-resolved `{ url, method, init }` ready for `fetch()`.
   *
   * @example
   * onRequest: (req) => {
   *   req.init.headers['X-Request-Id'] = crypto.randomUUID()
   *   req.init.headers['Authorization'] = `Bearer ${getToken()}`
   *   return req
   * }
   */
  onRequest?: (
    request: ResolvedRequest
  ) => ResolvedRequest | Promise<ResolvedRequest>

  /**
   * Runs after `fetch()` resolves and the body is parsed, before the 2xx check.
   * Receives every response regardless of status — including 4xx and 5xx.
   * The right place for logging, metrics, or reading headers on error responses.
   *
   * Returning a response with `ok: true` suppresses the error for that status.
   * Must return the `FetchResponse` (modified or unchanged).
   *
   * @param response Parsed response; may be non-2xx.
   *
   * @example
   * onResponse: (res) => {
   *   metrics.histogram('http.response', res.status)
   *   return res
   * }
   */
  onResponse?: <T>(
    response: FetchResponse<T>
  ) => FetchResponse<T> | Promise<FetchResponse<T>>

  /**
   * Runs only for successful (2xx) responses, after `onResponse`.
   * Use this to unwrap API envelope shapes or normalise the response
   * structure before the data reaches the caller.
   *
   * Must return the `FetchResponse` (modified or unchanged).
   *
   * @param response Verified 2xx response with parsed `data`.
   *
   * @example
   * onSuccess: (res) => {
   *   return { ...res, data: (res.data as ApiEnvelope<unknown>).payload }
   * }
   */
  onSuccess?: <T>(
    response: FetchResponse<T>
  ) => FetchResponse<T> | Promise<FetchResponse<T>>

  /**
   * Runs just before a `FetchError` is thrown — covers non-2xx HTTP errors,
   * network failures, and timeouts in one place.
   * Use for centralised error logging, token refresh, or redirects.
   *
   * Must re-throw the error or throw a new one. Returning a value is
   * intentionally disallowed; use `onSuccess` to transform successful data.
   *
   * @param error `FetchError` with `.status`, `.isHttpError`, `.isTimeout`, etc.
   *
   * @example
   * onError: (err) => {
   *   Sentry.captureException(err)
   *   if (err.status === 401) router.push('/login')
   *   throw err
   * }
   */
  onError?: (error: FetchError) => never | Promise<never>
}

/**
 * Options accepted by `createFetch()` to configure a reusable instance.
 *
 * @example
 * export const api = createFetch({
 *   baseURL: process.env.NEXT_PUBLIC_API_URL,
 *   headers: { 'X-App-Version': '2.0' },
 *   timeout: 10_000,
 *   next: { revalidate: 60 },
 *   interceptors: {
 *     onRequest: (req) => {
 *       req.init.headers['Authorization'] = `Bearer ${getToken()}`
 *       return req
 *     },
 *   },
 * })
 */
export interface CreateFetchOptions {
  /**
   * Prepended to every relative path passed to the HTTP methods.
   * Trailing slashes are normalised automatically.
   */
  baseURL?: string
  /**
   * Default headers merged into every request.
   * Per-request headers take precedence (last-write-wins, case-insensitive).
   */
  headers?: Record<string, string>
  /**
   * Default timeout in milliseconds applied to every request.
   * Can be overridden per-request via `FetchOptions.timeout`.
   */
  timeout?: number
  /** Lifecycle hooks applied to every request on this instance. */
  interceptors?: Interceptors
  /**
   * Default Next.js caching options applied to every request.
   * Per-request `next` options are merged on top (per-request wins on conflict).
   */
  next?: NextOptions
}

/**
 * Error thrown by `$fetch` for HTTP errors (non-2xx), network failures,
 * and request timeouts.
 *
 * @example
 * try {
 *   await api.get('/protected')
 * } catch (err) {
 *   if (err instanceof FetchError) {
 *     console.log(err.status)         // 403
 *     console.log(err.isHttpError)    // true
 *     console.log(err.response?.data) // parsed error body
 *   }
 * }
 */
export class FetchError extends Error {
  /**
   * HTTP status code.
   * `0` for network errors (no server response).
   * `-1` for timeout errors.
   */
  public readonly status: number

  /** HTTP status text, or `"Network Error"` / `"Timeout"`. */
  public readonly statusText: string

  /**
   * The parsed response, available when the server responded
   * (i.e. `isHttpError === true`).
   */
  public readonly response?: FetchResponse<unknown>

  constructor(
    message: string,
    status: number,
    statusText: string,
    response?: FetchResponse<unknown>
  ) {
    super(message)
    this.name = 'FetchError'
    this.status = status
    this.statusText = statusText
    this.response = response
    Object.setPrototypeOf(this, FetchError.prototype)
  }

  /** `true` when the server responded with a non-2xx status code. */
  get isHttpError(): boolean {
    return this.status > 0
  }

  /** `true` when no server response was received (DNS, TCP, CORS, etc.). */
  get isNetworkError(): boolean {
    return this.status === 0
  }

  /** `true` when the request was aborted because it exceeded the timeout. */
  get isTimeout(): boolean {
    return this.status === -1
  }
}

function buildQueryString(params: QueryParams): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) qs.append(key, String(item))
      }
    } else {
      qs.append(key, String(value))
    }
  }
  const str = qs.toString()
  return str ? `?${str}` : ''
}

function buildUrl(base: string, path: string, params?: QueryParams): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}${params ? buildQueryString(params) : ''}`
}

function isFormData(v: unknown): v is FormData {
  return typeof FormData !== 'undefined' && v instanceof FormData
}

function isURLSearchParams(v: unknown): v is URLSearchParams {
  return typeof URLSearchParams !== 'undefined' && v instanceof URLSearchParams
}

function serializeBody(body: unknown): {
  bodyInit: BodyInit
  contentType?: string
} {
  if (isFormData(body) || isURLSearchParams(body)) {
    return { bodyInit: body }
  }
  if (
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    typeof body === 'string'
  ) {
    return { bodyInit: body as BodyInit }
  }
  return { bodyInit: JSON.stringify(body), contentType: 'application/json' }
}

function mergeHeaders(
  ...sources: (HeadersInit | Record<string, string> | undefined)[]
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const src of sources) {
    if (!src) continue
    const entries =
      src instanceof Headers
        ? [...src.entries()]
        : Array.isArray(src)
          ? (src as [string, string][])
          : Object.entries(src)
    for (const [k, v] of entries) {
      result[k.toLowerCase()] = v
    }
  }
  return result
}

/**
 * Creates a pre-configured `$fetch` instance with a shared base URL,
 * default headers, timeout, Next.js cache options, and lifecycle hooks.
 *
 * All options can be overridden per-request.
 *
 * @param instanceOptions Instance-level defaults.
 * @returns An object with `get`, `post`, `put`, `patch`, `delete`, `head`,
 *   `options`, and `request` methods.
 *
 * @example
 * export const api = createFetch({
 *   baseURL: process.env.NEXT_PUBLIC_API_URL,
 *   headers: { 'X-App-Version': '1.0' },
 *   timeout: 10_000,
 *   next: { revalidate: 60 },
 *   interceptors: {
 *     onRequest: (req) => {
 *       req.init.headers['Authorization'] = `Bearer ${getToken()}`
 *       return req
 *     },
 *     onError: (err) => {
 *       if (err.status === 401) router.push('/login')
 *       throw err
 *     },
 *   },
 * })
 */
export function createFetch(instanceOptions: CreateFetchOptions = {}) {
  const {
    baseURL: instanceBaseURL = '',
    headers: instanceHeaders = {},
    timeout: instanceTimeout,
    interceptors = {},
    next: instanceNext,
  } = instanceOptions

  async function coreRequest<
    TData = unknown,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    method: HttpMethod,
    path: string,
    options: FetchOptions<TBody, TParams> = {}
  ): Promise<FetchResponse<TData>> {
    const {
      params,
      body,
      baseURL: perReqBaseURL,
      timeout = instanceTimeout,
      next: perReqNext,
      headers: perReqHeaders,
      signal: perReqSignal,
      ...restInit
    } = options

    const mergedHeaders = mergeHeaders(instanceHeaders, perReqHeaders)

    let bodyInit: BodyInit | undefined
    if (
      body !== undefined &&
      body !== null &&
      method !== 'GET' &&
      method !== 'HEAD'
    ) {
      const { bodyInit: b, contentType } = serializeBody(body)
      bodyInit = b
      if (contentType && !mergedHeaders['content-type']) {
        mergedHeaders['content-type'] = contentType
      }
    }

    const base = perReqBaseURL ?? instanceBaseURL
    const url = base
      ? buildUrl(base, path, params)
      : `${path}${params ? buildQueryString(params) : ''}`

    const nextOptions: NextOptions | undefined =
      instanceNext || perReqNext
        ? { ...instanceNext, ...perReqNext }
        : undefined

    let resolvedCache = restInit.cache
    if (!resolvedCache && nextOptions) {
      if (nextOptions.revalidate === false) resolvedCache = 'no-store'
      else if (typeof nextOptions.revalidate === 'number')
        resolvedCache = 'force-cache'
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let signal: AbortSignal | undefined = perReqSignal ?? undefined

    if (timeout) {
      const controller = new AbortController()
      timeoutId = setTimeout(() => controller.abort(), timeout)
      if (perReqSignal) {
        perReqSignal.addEventListener('abort', () => controller.abort(), {
          once: true,
        })
      }
      signal = controller.signal
    }

    const fetchInit: RequestInit & { next?: NextOptions } = {
      ...restInit,
      method,
      headers: mergedHeaders,
      ...(bodyInit !== undefined ? { body: bodyInit } : {}),
      ...(resolvedCache ? { cache: resolvedCache } : {}),
      ...(signal ? { signal } : {}),
      ...(nextOptions ? { next: nextOptions } : {}),
    }

    let resolved: ResolvedRequest = { url, method, init: fetchInit }
    if (interceptors.onRequest) {
      resolved = await interceptors.onRequest(resolved)
    }

    try {
      const raw = await fetch(resolved.url, resolved.init)
      if (timeoutId) clearTimeout(timeoutId)

      let data: TData
      const ct = raw.headers.get('content-type') ?? ''

      if (raw.status === 204 || raw.headers.get('content-length') === '0') {
        data = undefined as TData
      } else if (ct.includes('application/json')) {
        data = (await raw.json()) as TData
      } else if (ct.includes('text/')) {
        data = (await raw.text()) as TData
      } else {
        data = (await raw.blob()) as TData
      }

      const fetchResponse: FetchResponse<TData> = {
        data,
        status: raw.status,
        statusText: raw.statusText,
        headers: raw.headers,
        ok: raw.ok,
      }

      const observed = interceptors.onResponse
        ? await interceptors.onResponse(fetchResponse)
        : fetchResponse

      if (!observed.ok) {
        const err = new FetchError(
          `Request failed with status ${observed.status}`,
          observed.status,
          observed.statusText,
          observed as FetchResponse<unknown>
        )
        if (interceptors.onError)
          return (await interceptors.onError(err)) as never
        throw err
      }

      const succeeded = interceptors.onSuccess
        ? await interceptors.onSuccess(observed)
        : observed

      return succeeded as FetchResponse<TData>
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId)
      if (err instanceof FetchError) throw err

      const isAbortTimeout =
        err instanceof DOMException && err.name === 'AbortError' && !!timeout

      const fetchError = new FetchError(
        isAbortTimeout
          ? `Request timed out after ${timeout}ms`
          : (err as Error).message,
        isAbortTimeout ? -1 : 0,
        isAbortTimeout ? 'Timeout' : 'Network Error'
      )

      if (interceptors.onError)
        return (await interceptors.onError(fetchError)) as never
      throw fetchError
    }
  }

  return {
    /**
     * Performs a GET request. Safe and idempotent.
     * Supports all Next.js App Router caching options via `next` and `cache`.
     *
     * @template TData Expected response body type.
     * @param url Path or full URL.
     * @param options Request options (all `RequestInit` fields are supported).
     *
     * @example
     * const { data } = await api.get<User[]>('/users', {
     *   params: { page: 1 },
     *   next: { revalidate: 60, tags: ['users'] },
     * })
     */
    get<TData = unknown, TParams extends QueryParams = QueryParams>(
      url: string,
      options?: Omit<FetchOptions<never, TParams>, 'body'>
    ): Promise<FetchResponse<TData>> {
      return coreRequest<TData, never, TParams>('GET', url, options)
    },

    /**
     * Performs a POST request. Use for resource creation or form submission.
     *
     * @template TData Expected response body type.
     * @template TBody Request body type.
     * @param url Path or full URL.
     * @param body Request body — plain objects are JSON-serialised automatically.
     * @param options Additional request options.
     *
     * @example
     * const { data } = await api.post<User, CreateUserDto>('/users', {
     *   name: 'Mamun',
     *   email: 'mamun@example.com',
     * })
     */
    post<
      TData = unknown,
      TBody = unknown,
      TParams extends QueryParams = QueryParams,
    >(
      url: string,
      body?: TBody,
      options?: Omit<FetchOptions<TBody, TParams>, 'body'>
    ): Promise<FetchResponse<TData>> {
      return coreRequest<TData, TBody, TParams>('POST', url, {
        ...options,
        body,
      })
    },

    /**
     * Performs a PUT request. Use for full resource replacement.
     *
     * @template TData Expected response body type.
     * @template TBody Request body type.
     * @param url Path or full URL.
     * @param body Replacement body.
     * @param options Additional request options.
     */
    put<
      TData = unknown,
      TBody = unknown,
      TParams extends QueryParams = QueryParams,
    >(
      url: string,
      body?: TBody,
      options?: Omit<FetchOptions<TBody, TParams>, 'body'>
    ): Promise<FetchResponse<TData>> {
      return coreRequest<TData, TBody, TParams>('PUT', url, {
        ...options,
        body,
      })
    },

    /**
     * Performs a PATCH request. Use for partial resource updates.
     *
     * @template TData Expected response body type.
     * @template TBody Request body type.
     * @param url Path or full URL.
     * @param body Partial update body.
     * @param options Additional request options.
     *
     * @example
     * await api.patch<User, Partial<UpdateUserDto>>('/users/123', { role: 'admin' })
     */
    patch<
      TData = unknown,
      TBody = unknown,
      TParams extends QueryParams = QueryParams,
    >(
      url: string,
      body?: TBody,
      options?: Omit<FetchOptions<TBody, TParams>, 'body'>
    ): Promise<FetchResponse<TData>> {
      return coreRequest<TData, TBody, TParams>('PATCH', url, {
        ...options,
        body,
      })
    },

    /**
     * Performs a DELETE request.
     *
     * @template TData Expected response body type (often `void` or `{ success: boolean }`).
     * @param url Path or full URL.
     * @param options Additional request options.
     *
     * @example
     * await api.delete('/users/123')
     */
    delete<TData = unknown, TParams extends QueryParams = QueryParams>(
      url: string,
      options?: Omit<FetchOptions<never, TParams>, 'body'>
    ): Promise<FetchResponse<TData>> {
      return coreRequest<TData, never, TParams>('DELETE', url, options)
    },

    /**
     * Performs a HEAD request — identical to GET but the server returns only
     * headers with no response body. Useful for existence checks or cache probing.
     *
     * @param url Path or full URL.
     * @param options Additional request options.
     *
     * @example
     * const { status } = await api.head('/users/123')
     * const exists = status === 200
     */
    head<TParams extends QueryParams = QueryParams>(
      url: string,
      options?: Omit<FetchOptions<never, TParams>, 'body'>
    ): Promise<FetchResponse<never>> {
      return coreRequest<never, never, TParams>('HEAD', url, options)
    },

    /**
     * Performs an OPTIONS request. Typically used for CORS preflight
     * or to discover allowed methods on an endpoint.
     *
     * @template TData Expected response body type.
     * @param url Path or full URL.
     * @param options Additional request options.
     */
    options<TData = unknown, TParams extends QueryParams = QueryParams>(
      url: string,
      options?: Omit<FetchOptions<never, TParams>, 'body'>
    ): Promise<FetchResponse<TData>> {
      return coreRequest<TData, never, TParams>('OPTIONS', url, options)
    },

    /**
     * Raw escape hatch — full control over the HTTP method and body.
     * Useful when the method is not covered by the named shortcuts or is
     * dynamic at runtime.
     *
     * @template TData Expected response body type.
     * @template TBody Request body type.
     * @param method HTTP method string.
     * @param url Path or full URL.
     * @param options Full request options including `body`.
     *
     * @example
     * const { data } = await api.request<Stats>('REPORT', '/calendar', {
     *   body: { start: '2024-01-01', end: '2024-12-31' },
     * })
     */
    request<
      TData = unknown,
      TBody = unknown,
      TParams extends QueryParams = QueryParams,
    >(
      method: HttpMethod,
      url: string,
      options?: FetchOptions<TBody, TParams>
    ): Promise<FetchResponse<TData>> {
      return coreRequest<TData, TBody, TParams>(method, url, options)
    },
  } as const
}

/**
 * Default `$fetch` instance with no pre-configured base URL or options.
 * Import and use directly for quick one-off requests, or call `createFetch()`
 * to create a shared instance with defaults.
 *
 * @example
 * import { $fetch } from '@/lib/$fetch'
 *
 * const { data } = await $fetch.get<User>('https://api.example.com/me', {
 *   credentials: 'include',
 * })
 */
export const $fetch = createFetch()

export type { QueryParamValue }

export { createFetch as default }

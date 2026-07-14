import { buildUrl } from './build-url'
import { FetchError } from './fetch-error'
import { createMethodShorthands, type FetchMethods } from './method-shorthands'
import { serializeBody } from './serialize-body'
import type {
  FetchConfig,
  FetchResponse,
  QueryParams,
  RequestContext,
} from './types'

/**
 * Parses a `Response` body according to its `Content-Type` (and status),
 * mirroring the leniency of typical REST APIs:
 * - `204`/`205` or `Content-Length: 0` → `null` (no body to parse).
 * - `application/json` (or unrecognized/missing Content-Type) → JSON-parsed, falling back to raw text if parsing fails.
 * - `text/*` → plain text.
 * - `multipart/form-data` / `application/x-www-form-urlencoded` → `FormData`.
 */
async function parseResponseData(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  const contentLength = response.headers.get('Content-Length')

  if (contentLength === '0') {
    return null
  }

  if (contentType.includes('application/json')) {
    const text = await response.text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  if (contentType.startsWith('text/')) {
    return response.text()
  }

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    return response.formData()
  }

  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Extracts a `message` string from a parsed response body, if the body is
 * an object with a string `message` field.
 */
function extractMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message
    return typeof message === 'string' ? message : null
  }
  return null
}

/**
 * The base `$fetch` implementation. See the exported, method-shorthand-
 * augmented `$fetch` below for the public entry point.
 *
 * Generic parameter order is always `TResponse, TBody, TParams`.
 *
 * @typeParam TResponse - Shape of the parsed response body.
 * @typeParam TBody - Shape of the request body before serialization.
 * @typeParam TParams - Shape of the query params before serialization.
 * @param input - An absolute URL, or a path relative to `init.baseUrl`.
 * @param init - Request configuration; extends the native `RequestInit` plus `baseUrl`, `params`, and lifecycle hooks.
 * @returns The normalized {@link FetchResponse}, or a hook-provided fallback if `onError` recovers from a failure.
 * @throws {FetchError} When the response resolves with `ok === false` and no `onError` hook recovers.
 * @throws The original native error (unmodified) on network-level failures (DNS, abort, ...) when no `onError` hook recovers.
 */
async function baseFetch<
  TResponse = unknown,
  TBody = unknown,
  TParams extends QueryParams = QueryParams,
>(
  input: string,
  init: FetchConfig<TResponse, TBody, TParams> = {}
): Promise<FetchResponse<TResponse>> {
  const {
    baseUrl,
    params,
    body,
    headers: initHeaders,
    onRequest,
    onResponse,
    onSuccess,
    onError,
    next,
    ...nativeInit
  } = init

  const url = buildUrl(input, baseUrl, params)
  const headers = new Headers(initHeaders)
  const { body: serializedBody, headers: finalHeaders } = serializeBody(
    body,
    headers
  )

  let requestContext: RequestContext = {
    url,
    init: {
      ...nativeInit,
      headers: finalHeaders,
      body: serializedBody,
      ...(next ? { next } : {}),
    } as RequestInit,
  }

  if (onRequest) {
    requestContext = await onRequest(requestContext)
  }

  let rawResponse: Response

  try {
    rawResponse = await fetch(requestContext.url, requestContext.init)
  } catch (error) {
    if (onError) {
      const handled = await onError(error)
      if (handled !== undefined) return handled as FetchResponse<TResponse>
    }
    throw error
  }

  if (onResponse) {
    rawResponse = await onResponse(rawResponse)
  }

  const data = (await parseResponseData(rawResponse)) as TResponse

  const result: FetchResponse<TResponse> = {
    data,
    response: rawResponse,
    status: rawResponse.status,
    statusText: rawResponse.statusText,
    ok: rawResponse.ok,
    url: rawResponse.url || requestContext.url,
    headers: rawResponse.headers,
    message: extractMessage(data),
  }

  if (!result.ok) {
    const fetchError = new FetchError<TResponse>(result)

    if (onError) {
      const handled = await onError(fetchError)
      if (handled !== undefined) return handled as FetchResponse<TResponse>
    }

    throw fetchError
  }

  if (onSuccess) {
    return onSuccess(result)
  }

  return result
}

/**
 * Type-safe fetch utility for Next.js (App Router). Extends the native
 * `RequestInit` so every current and future fetch option works with zero
 * extra code, and adds `baseUrl`, automatic query/body serialization, and
 * `onRequest`/`onResponse`/`onSuccess`/`onError` lifecycle hooks.
 *
 * Also exposes HTTP method shorthands with `method` fixed and omitted from
 * their options: `$fetch.get`, `$fetch.post`, `$fetch.put`, `$fetch.patch`,
 * `$fetch.delete`, `$fetch.head`.
 *
 * @example Basic POST — login
 * ```ts
 * import type { TLoginInput } from '@/types/auth.types'
 * import type { TUserResponse } from '@/types/user.types'
 *
 * const { data, status, ok } = await $fetch<TUserResponse, TLoginInput>('/auth/login', {
 *   baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
 *   method: 'POST',
 *   body: { email, password },
 * })
 * ```
 *
 * @example Method shorthands — GET list with params, POST create
 * ```ts
 * import type { TUsersResponse, TUserQueryOptions, TCreateUserInput, TUserResponse } from '@/types/user.types'
 *
 * // GET with query params
 * const { data: users } = await $fetch.get<TUsersResponse, TUserQueryOptions>('/users', {
 *   baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
 *   params: { page: 1, limit: 20, role: 'USER' },
 * })
 *
 * // POST create
 * const { data: created } = await $fetch.post<TUserResponse, TCreateUserInput>('/users', {
 *   baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
 *   body: { email: 'alice@example.com', password: 'SecurePass1!' },
 * })
 * ```
 */
export const $fetch: typeof baseFetch & FetchMethods = Object.assign(
  baseFetch,
  createMethodShorthands(baseFetch)
)

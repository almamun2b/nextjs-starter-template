/**
 * Scalar value types accepted as a single query-parameter value or as a
 * body field value. `null`/`undefined` entries are omitted from query strings.
 * Use explicit string formatting for any domain-specific types (e.g. ISO-format
 * a date before passing it as a param or body field).
 */
export type Primitive = string | number | boolean | null | undefined

/**
 * A single query-param value: either a {@link Primitive} or an array of them
 * (arrays are serialized as repeated keys, e.g. `?tag=a&tag=b`).
 */
export type QueryParamValue = Primitive | Primitive[]

/**
 * A flat map of query-string parameters to be appended to the request URL.
 */
export type QueryParams = Record<string, QueryParamValue>

/**
 * Any value accepted as a request body: a native `BodyInit` (FormData, Blob,
 * ArrayBuffer, ReadableStream, URLSearchParams, string, ...), a plain
 * serializable object/array, or `null`.
 */
export type FetchBody = BodyInit | Record<string, unknown> | unknown[] | null

/**
 * How `$fetch` reads the response body. `auto` picks by `Content-Type`; use an
 * explicit type for binary payloads (`blob`, `arrayBuffer`) or to consume the
 * raw `ReadableStream` yourself (`stream`).
 */
export type ResponseType =
  | 'auto'
  | 'json'
  | 'text'
  | 'blob'
  | 'arrayBuffer'
  | 'stream'

/**
 * Automatic retry policy. Off by default (`attempts: 0`). Only failures that
 * are safe to replay are retried: idempotent `methods`, and either a
 * `network`/`timeout` error or one of `statusCodes`.
 */
export interface RetryOptions {
  /** Extra attempts after the first one. Default `0`. */
  attempts?: number
  /** Upper-case methods that may be retried. Default `['GET', 'HEAD', 'OPTIONS']`. */
  methods?: string[]
  /** HTTP statuses that may be retried. Default `[408, 429, 502, 503, 504]`. */
  statusCodes?: number[]
  /** First backoff step; doubles each attempt, with jitter. Default `250`. */
  baseDelayMs?: number
  /** Longest wait between attempts; a longer `Retry-After` stops retrying. Default `3000`. */
  maxDelayMs?: number
}

/**
 * Next.js-specific fetch cache/tagging options, mirrored from the extended
 * `RequestInit` that Next.js's `fetch` accepts on the server.
 */
export interface NextFetchRequestConfig {
  /** Number of seconds after which the cached response should be revalidated, or `false` to opt out. */
  revalidate?: number | false
  /** Cache tags used for on-demand revalidation via `revalidateTag`. */
  tags?: string[]
}

/**
 * The finalized request shape passed into (and returned from) the
 * `onRequest` hook, immediately before the native `fetch` call is made.
 */
export interface RequestContext {
  /** The fully-built absolute URL (baseUrl + path + serialized params). */
  url: string
  /** The native `RequestInit` that will be passed to `fetch`. */
  init: RequestInit
}

/**
 * The normalized result returned by `$fetch` on a successful (or
 * hook-recovered) request.
 *
 * @typeParam TResponse - Shape of the parsed response body (`data`).
 */
export interface FetchResponse<TResponse = unknown> {
  /** Parsed response body (JSON-parsed, text, or FormData depending on Content-Type). */
  data: TResponse
  /** The `Response` returned by the native `fetch`. Its body has already been read into `data`. */
  response: Response
  status: number
  statusText: string
  ok: boolean
  url: string
  /** Convenience extraction of `data.message` when the parsed body is an object with a `message` string field, otherwise `null`. */
  message: string | null
}

/**
 * Called just before the native `fetch` call, with the fully-built URL and
 * `RequestInit`. Return a (possibly modified) {@link RequestContext} to
 * mutate the outgoing request, e.g. to inject an auth header.
 */
export type OnRequestHook = (
  req: RequestContext
) => RequestContext | Promise<RequestContext>

/**
 * Called immediately after the native `fetch` call resolves, before the
 * response body is parsed. Return a (possibly modified/cloned) `Response`.
 */
export type OnResponseHook = (res: Response) => Response | Promise<Response>

/**
 * Called after a successful (`response.ok === true`) request has been fully
 * parsed into a {@link FetchResponse}. Return a (possibly modified)
 * {@link FetchResponse} to transform the final result.
 */
export type OnSuccessHook<TResponse = unknown> = (
  res: FetchResponse<TResponse>
) => FetchResponse<TResponse> | Promise<FetchResponse<TResponse>>

/**
 * Called whenever a request fails, after any automatic retries. `error` is a
 * `FetchError` for every failure `$fetch` itself detects — check its `kind`
 * (`http`, `network`, `timeout`, `abort`, `parse`). Errors thrown by your own
 * `onRequest`/`onResponse` hooks arrive unchanged.
 *
 * Return a value to have `$fetch` resolve with that value instead of
 * throwing (recovery), or return `undefined`/rethrow to propagate the error.
 *
 * The optional second argument exposes the failed request and a one-shot
 * `retry` (see {@link ErrorContext}), e.g. to re-send after refreshing auth.
 */
export type OnErrorHook = (
  error: unknown,
  context: ErrorContext
) => unknown | Promise<unknown>

/**
 * Passed to {@link OnErrorHook} alongside the error.
 */
export interface ErrorContext {
  /** The request exactly as it was sent (after `onRequest`). */
  request: RequestContext
  /**
   * Re-sends the same request. `init` is shallow-merged over the original
   * `RequestInit`, with `headers` merged per-key. The retry runs `onResponse`,
   * the automatic retry policy, and `onSuccess`, but never `onError` again, so
   * it cannot recurse — a failed retry throws a `FetchError`. A
   * `ReadableStream` body cannot be replayed.
   */
  retry: <TResponse = unknown>(
    init?: RequestInit
  ) => Promise<FetchResponse<TResponse>>
}

/**
 * Lifecycle hooks shared by both a single `$fetch` call and an
 * `createFetch`-created instance. Instance-level and call-level hooks are
 * composed: `onRequest`/`onResponse`/`onSuccess` run instance-first;
 * `onError` runs call-level first and falls through to the instance hook when
 * the call-level one returns `undefined` or rethrows the same error.
 */
export interface FetchHooks<TResponse = unknown> {
  onRequest?: OnRequestHook
  onResponse?: OnResponseHook
  onSuccess?: OnSuccessHook<TResponse>
  onError?: OnErrorHook
}

/**
 * Configuration accepted by `$fetch` (and, minus `baseUrl`/params/body
 * quirks, by `createFetch`). Extends the native `RequestInit` (excluding
 * `body`, which is re-typed to also accept plain objects/arrays for
 * automatic JSON serialization) so every current and future native fetch
 * option (`cache`, `credentials`, `mode`, `signal`, `keepalive`, `priority`,
 * `redirect`, `referrer`, `referrerPolicy`, `integrity`, `window`, ...)
 * works with zero additional code.
 *
 * Generic parameter order is always `TResponse, TBody, TParams`.
 *
 * @typeParam TResponse - Shape of the parsed response body.
 * @typeParam TBody - Shape of the request body before serialization.
 * @typeParam TParams - Shape of the query params before serialization.
 */
export interface FetchConfig<
  TResponse = unknown,
  TBody = unknown,
  TParams extends QueryParams = QueryParams,
>
  extends Omit<RequestInit, 'body'>, FetchHooks<TResponse> {
  /** Base URL prepended to relative `input` paths. Ignored when `input` is already absolute. */
  baseUrl?: string
  /** Query parameters to serialize and append to the URL. */
  params?: TParams
  /** Request body. Plain objects/arrays are JSON-serialized automatically; native `BodyInit` values pass through untouched. */
  body?: TBody | BodyInit | null
  /** Next.js server-side cache/revalidation options. */
  next?: NextFetchRequestConfig
  /**
   * Milliseconds before the attempt is aborted with a `timeout` `FetchError`.
   * Covers the response body too. Applies per attempt. Default: no timeout.
   */
  timeout?: number
  /** Automatic retry policy; a number is shorthand for `{ attempts }`. See {@link RetryOptions}. */
  retry?: number | RetryOptions
  /** How to read the response body. Default `'auto'`. See {@link ResponseType}. */
  responseType?: ResponseType
}

/**
 * Configuration accepted by `createFetch` to create a preconfigured instance.
 * Identical to {@link FetchConfig} but intended for instance-wide defaults
 * (e.g. `baseUrl`, shared `headers`, shared hooks) that every call through
 * the returned instance will inherit and can override.
 */
export interface CreateFetchConfig<TResponse = unknown> extends FetchConfig<
  TResponse,
  unknown,
  QueryParams
> {
  baseUrl?: string
}

/**
 * The callable shape of `$fetch` and of any instance returned by
 * `createFetch` — a single async function generic over
 * `TResponse, TBody, TParams` (always in that order).
 */
export type FetchFn = <
  TResponse = unknown,
  TBody = unknown,
  TParams extends QueryParams = QueryParams,
>(
  input: string,
  init?: FetchConfig<TResponse, TBody, TParams>
) => Promise<FetchResponse<TResponse>>

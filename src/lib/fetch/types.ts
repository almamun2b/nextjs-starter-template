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
  /** The raw, untouched `Response` object returned by the native `fetch`. */
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
 * Called whenever a request fails — either a network-level failure (e.g.
 * DNS/abort, in which case `error` is the native thrown error/`TypeError`)
 * or an HTTP-level failure (`response.ok === false`, in which case `error`
 * is a {@link FetchError} carrying the parsed response).
 *
 * Return a value to have `$fetch` resolve with that value instead of
 * throwing (recovery), or return `undefined`/rethrow to propagate the error.
 */
export type OnErrorHook = (error: unknown) => unknown | Promise<unknown>

/**
 * Lifecycle hooks shared by both a single `$fetch` call and an
 * `createFetch`-created instance. Instance-level and call-level hooks are
 * composed (instance hook runs first) except for `onError`, where a
 * call-level hook fully overrides the instance-level one.
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

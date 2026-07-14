import type { FetchConfig, FetchResponse, QueryParams } from './types'

/**
 * The minimal callable shape required to build method shorthands on top of:
 * a generic `(input, init) => Promise<FetchResponse<TResponse>>` function,
 * always generic in the order `TResponse, TBody, TParams`.
 */
type FetchLike = <
  TResponse = unknown,
  TBody = unknown,
  TParams extends QueryParams = QueryParams,
>(
  input: string,
  init?: FetchConfig<TResponse, TBody, TParams>
) => Promise<FetchResponse<TResponse>>

/** Config accepted by the bodyless shorthands (`get`, `head`) — `method` and `body` are fixed internally. */
type BodylessConfig<TResponse, TParams extends QueryParams> = Omit<
  FetchConfig<TResponse, unknown, TParams>,
  'method' | 'body'
>

/** Config accepted by the body-carrying shorthands (`post`, `put`, `patch`, `delete`) — `method` is fixed internally. */
type BodyfulConfig<TResponse, TBody, TParams extends QueryParams> = Omit<
  FetchConfig<TResponse, TBody, TParams>,
  'method'
>

/**
 * HTTP method shorthands layered on top of a {@link FetchLike} function.
 * `method` is supplied internally, so it's omitted from every shorthand's
 * options — generic parameter order is always `TResponse, TBody, TParams`
 * (bodyless methods omit `TBody`).
 */
export interface FetchMethods {
  get<TResponse = unknown, TParams extends QueryParams = QueryParams>(
    input: string,
    init?: BodylessConfig<TResponse, TParams>
  ): Promise<FetchResponse<TResponse>>

  head<TResponse = unknown, TParams extends QueryParams = QueryParams>(
    input: string,
    init?: BodylessConfig<TResponse, TParams>
  ): Promise<FetchResponse<TResponse>>

  post<
    TResponse = unknown,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    input: string,
    init?: BodyfulConfig<TResponse, TBody, TParams>
  ): Promise<FetchResponse<TResponse>>

  put<
    TResponse = unknown,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    input: string,
    init?: BodyfulConfig<TResponse, TBody, TParams>
  ): Promise<FetchResponse<TResponse>>

  patch<
    TResponse = unknown,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    input: string,
    init?: BodyfulConfig<TResponse, TBody, TParams>
  ): Promise<FetchResponse<TResponse>>

  delete<
    TResponse = unknown,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    input: string,
    init?: BodyfulConfig<TResponse, TBody, TParams>
  ): Promise<FetchResponse<TResponse>>
}

/**
 * Builds a {@link FetchMethods} object whose methods delegate to `fetchImpl`
 * with `method` fixed accordingly, e.g. `methods.get(url, init)` calls
 * `fetchImpl(url, { ...init, method: 'GET' })`.
 *
 * Used to attach `.get`/`.post`/`.put`/`.patch`/`.delete`/`.head` shorthands
 * onto both the top-level `$fetch` export and any `createFetch`-created
 * instance, without altering the existing `$fetch(input, init)` call form.
 *
 * @param fetchImpl - The underlying callable (`$fetch` or a `createFetch` instance) to delegate to.
 */
export function createMethodShorthands(fetchImpl: FetchLike): FetchMethods {
  return {
    get: (input, init) => fetchImpl(input, { ...init, method: 'GET' }),
    head: (input, init) => fetchImpl(input, { ...init, method: 'HEAD' }),
    post: (input, init) => fetchImpl(input, { ...init, method: 'POST' }),
    put: (input, init) => fetchImpl(input, { ...init, method: 'PUT' }),
    patch: (input, init) => fetchImpl(input, { ...init, method: 'PATCH' }),
    delete: (input, init) => fetchImpl(input, { ...init, method: 'DELETE' }),
  } as FetchMethods
}

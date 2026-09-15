/**
 * Public entry point for the type-safe Next.js fetch core.
 *
 * - `createFetch` — creates a preconfigured instance (base URL, headers, hooks, timeout, retry).
 * - `FetchError` + `isFetchError`/`isHttpError`/`isTimeoutError`/`isNetworkError` — the error thrown for every failure.
 *
 * The unconfigured core `$fetch` is deliberately not re-exported here: app
 * code should use the configured backend client from `@/lib/$fetch`, and the
 * shared name made it easy to import the wrong one (no base URL, no auth).
 * Import it from `@/lib/fetch/fetch` if you really need it.
 */
export { createFetch } from './create-fetch'
export {
  FetchError,
  isFetchError,
  isHttpError,
  isNetworkError,
  isTimeoutError,
} from './fetch-error'
export type {
  FetchErrorInit,
  FetchErrorKind,
  FetchErrorRequest,
} from './fetch-error'
export type { FetchMethods } from './method-shorthands'
export type {
  CreateFetchConfig,
  ErrorContext,
  FetchBody,
  FetchConfig,
  FetchFn,
  FetchHooks,
  FetchResponse,
  NextFetchRequestConfig,
  OnErrorHook,
  OnRequestHook,
  OnResponseHook,
  OnSuccessHook,
  Primitive,
  QueryParamValue,
  QueryParams,
  RequestContext,
  ResponseType,
  RetryOptions,
} from './types'

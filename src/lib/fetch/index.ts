/**
 * Public entry point for the type-safe Next.js `$fetch` utility.
 *
 * - `$fetch` — the ready-to-use fetch wrapper (plus `.get`/`.post`/`.put`/`.patch`/`.delete`/`.head` shorthands).
 * - `createFetch` — creates a preconfigured instance (e.g. with a shared `baseUrl`).
 * - `FetchError` — the error class thrown on HTTP-level failures.
 */
export { createFetch } from './create-fetch'
export { $fetch } from './fetch'
export { FetchError } from './fetch-error'
export type { FetchMethods } from './method-shorthands'
export type {
  FetchBody,
  FetchConfig,
  FetchFn,
  FetchHooks,
  FetchResponse,
  CreateFetchConfig,
  NextFetchRequestConfig,
  OnErrorHook,
  OnRequestHook,
  OnResponseHook,
  OnSuccessHook,
  Primitive,
  QueryParams,
  QueryParamValue,
  RequestContext,
} from './types'
export { useFetch } from './use-fetch'
export type { FetchStatus, UseFetchOptions, UseFetchResult } from './use-fetch'

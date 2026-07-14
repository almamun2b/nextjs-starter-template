import type { FetchConfig, QueryParams } from './types'

/** Merges two `HeadersInit` values, with `override` entries winning per-key. */
function mergeHeaders(base?: HeadersInit, override?: HeadersInit): Headers {
  const merged = new Headers(base)

  if (override) {
    const overrideHeaders = new Headers(override)
    overrideHeaders.forEach((value, key) => {
      merged.set(key, value)
    })
  }

  return merged
}

/**
 * Composes two single-argument hooks so both run in sequence: `base` first,
 * then `override`, each receiving the previous hook's output. If only one
 * is defined, it's returned as-is.
 */
function composeHooks<T extends (...args: never[]) => unknown>(
  base?: T,
  override?: T
): T | undefined {
  if (!base) return override
  if (!override) return base

  return (async (...args: Parameters<T>) => {
    const baseResult = await base(...args)
    const nextArgs = [baseResult, ...args.slice(1)] as Parameters<T>
    return override(...nextArgs)
  }) as unknown as T
}

/**
 * Merges a `createFetch` instance's default {@link FetchConfig} with a
 * per-call `FetchConfig`, so the call-site can override individual options
 * without discarding the rest of the instance defaults.
 *
 * Merge rules:
 * - `headers`, `params`, `next`: shallow-merged (call-level wins per-key).
 * - `onRequest`, `onResponse`, `onSuccess`: composed — instance hook runs first, call-level hook runs second.
 * - `onError`: call-level fully replaces instance-level (control-flow hooks don't compose meaningfully).
 * - Everything else (`method`, `cache`, `credentials`, `signal`, `baseUrl`, ...): call-level overrides instance default.
 *
 * Generic parameter order is always `TResponse, TBody, TParams`.
 */
export function mergeConfig<
  TResponse = unknown,
  TBody = unknown,
  TParams extends QueryParams = QueryParams,
>(
  base: FetchConfig<TResponse, TBody, TParams> = {},
  override: FetchConfig<TResponse, TBody, TParams> = {}
): FetchConfig<TResponse, TBody, TParams> {
  const {
    baseUrl: baseBaseUrl,
    params: baseParams,
    next: baseNext,
    headers: baseHeaders,
    onRequest: baseOnRequest,
    onResponse: baseOnResponse,
    onSuccess: baseOnSuccess,
    onError: baseOnError,
    ...baseRest
  } = base

  const {
    baseUrl: overrideBaseUrl,
    params: overrideParams,
    next: overrideNext,
    headers: overrideHeaders,
    onRequest: overrideOnRequest,
    onResponse: overrideOnResponse,
    onSuccess: overrideOnSuccess,
    onError: overrideOnError,
    ...overrideRest
  } = override

  return {
    ...baseRest,
    ...overrideRest,
    baseUrl: overrideBaseUrl ?? baseBaseUrl,
    params: { ...baseParams, ...overrideParams } as TParams,
    next: { ...baseNext, ...overrideNext },
    headers: mergeHeaders(baseHeaders, overrideHeaders),
    onRequest: composeHooks(baseOnRequest, overrideOnRequest),
    onResponse: composeHooks(baseOnResponse, overrideOnResponse),
    onSuccess: composeHooks(baseOnSuccess, overrideOnSuccess),
    onError: overrideOnError ?? baseOnError,
  }
}

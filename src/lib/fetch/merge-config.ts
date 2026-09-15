import type { FetchConfig, OnErrorHook, QueryParams } from './types'

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
 * Chains two `onError` hooks: `override` (call-level) runs first. If it
 * recovers (returns a value) or throws a *different* error, that wins;
 * otherwise — it returned `undefined` or rethrew the same error — `base`
 * (instance-level, e.g. silent token refresh) still gets its turn.
 */
function composeErrorHooks(
  base?: OnErrorHook,
  override?: OnErrorHook
): OnErrorHook | undefined {
  if (!base) return override
  if (!override) return base

  return async (error, context) => {
    try {
      const handled = await override(error, context)
      if (handled !== undefined) return handled
    } catch (thrown) {
      if (thrown !== error) throw thrown
    }
    return base(error, context)
  }
}

/** Shallow-merges two optional objects, keeping `undefined` when both are absent. */
function mergeObjects<T extends object>(base?: T, override?: T): T | undefined {
  if (!base && !override) return undefined
  return { ...base, ...override } as T
}

/**
 * Merges a `createFetch` instance's default {@link FetchConfig} with a
 * per-call `FetchConfig`, so the call-site can override individual options
 * without discarding the rest of the instance defaults.
 *
 * Merge rules:
 * - `headers`, `params`, `next`: shallow-merged (call-level wins per-key).
 * - `onRequest`, `onResponse`, `onSuccess`: composed — instance hook runs first, call-level hook runs second.
 * - `onError`: composed — call-level runs first, then instance-level unless the call-level hook recovered (see {@link composeErrorHooks}).
 * - Everything else (`method`, `cache`, `signal`, `baseUrl`, `timeout`, `retry`, `responseType`, ...): call-level overrides instance default.
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
    params: mergeObjects(baseParams, overrideParams),
    next: mergeObjects(baseNext, overrideNext),
    headers: mergeHeaders(baseHeaders, overrideHeaders),
    onRequest: composeHooks(baseOnRequest, overrideOnRequest),
    onResponse: composeHooks(baseOnResponse, overrideOnResponse),
    onSuccess: composeHooks(baseOnSuccess, overrideOnSuccess),
    onError: composeErrorHooks(baseOnError, overrideOnError),
  }
}

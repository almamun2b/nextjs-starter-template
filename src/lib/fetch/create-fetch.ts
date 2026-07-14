import { $fetch } from './fetch'
import { mergeConfig } from './merge-config'
import { createMethodShorthands, type FetchMethods } from './method-shorthands'
import type {
  FetchConfig,
  FetchResponse,
  CreateFetchConfig,
  QueryParams,
} from './types'

/**
 * Creates a preconfigured `$fetch` instance: a callable with the exact same
 * signature and method shorthands (`.get`, `.post`, `.put`, `.patch`,
 * `.delete`, `.head`) as `$fetch`, but with `defaults` (e.g. `baseUrl`,
 * shared `headers`, shared lifecycle hooks) merged underneath every call —
 * see {@link mergeConfig} for the exact merge rules.
 *
 * @param defaults - Instance-wide defaults applied to every call, overridable per-call.
 *
 * @example
 * ```ts
 * export const api = createFetch({
 *   baseUrl: process.env.NEXT_PUBLIC_API_URL,
 *   headers: { Accept: 'application/json' },
 *   next: { revalidate: 60 },
 * })
 *
 * const { data } = await api.get<PreordersResponse>('/preorders')
 * ```
 */
export function createFetch(defaults: CreateFetchConfig = {}) {
  async function apiFetch<
    TResponse = unknown,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    input: string,
    init: FetchConfig<TResponse, TBody, TParams> = {}
  ): Promise<FetchResponse<TResponse>> {
    const mergedConfig = mergeConfig<TResponse, TBody, TParams>(
      defaults as FetchConfig<TResponse, TBody, TParams>,
      init
    )
    return $fetch<TResponse, TBody, TParams>(input, mergedConfig)
  }

  return Object.assign(
    apiFetch,
    createMethodShorthands(apiFetch)
  ) as typeof apiFetch & FetchMethods
}

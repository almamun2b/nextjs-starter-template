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
 * // src/lib/$fetch.ts
 * import { cookies } from 'next/headers'
 * import { createFetch } from '@/lib/fetch'
 *
 * export const $fetch = createFetch({
 *   baseUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/server`,
 *   headers: { 'Content-Type': 'application/json' },
 *   credentials: 'include',
 *   onRequest: async (req) => {
 *     const cookieStore = await cookies()
 *     const cookieString = cookieStore.toString()
 *     if (cookieString) {
 *       const headers = new Headers(req.init.headers)
 *       headers.set('Cookie', cookieString)
 *       req.init.headers = headers
 *     }
 *     return req
 *   },
 * })
 *
 * // Then in server actions:
 * import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'
 * const { data } = await $fetch.get<TUsersResponse, TUserQueryOptions>('/users', { params: { page: 1 } })
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

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Lifecycle state of a `useFetch`-managed call. */
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * Options accepted by {@link useFetch}.
 *
 * @typeParam TData - The type of the data resolved by `action`.
 * @typeParam TArgs - The argument tuple type accepted by `action`.
 */
export interface UseFetchOptions<TData, TArgs extends unknown[]> {
  /**
   * The async function to run — typically a Next.js Server Action, or a
   * client call through `$fetch`/a `createFetch()` instance.
   */
  action: (...args: TArgs) => Promise<TData>
  /** When `true`, `action` is automatically invoked once on mount (using `args`, if provided). Defaults to `false`. */
  immediate?: boolean
  /** Default arguments used for the automatic `immediate` call, and as a fallback when `execute()` is called with no arguments. */
  args?: TArgs
  /** Called after `action` resolves successfully, with the resolved data. */
  onSuccess?: (data: TData) => void | Promise<void>
  /** Called after `action` rejects, with the error normalized to an `Error` instance. */
  onError?: (error: Error) => void | Promise<void>
}

/**
 * The state and controls returned by {@link useFetch}.
 *
 * @typeParam TData - The type of the data resolved by `action`.
 * @typeParam TArgs - The argument tuple type accepted by `action`.
 */
export interface UseFetchResult<TData, TArgs extends unknown[]> {
  /** The last successfully resolved value, or `null` before the first success (or after {@link UseFetchResult.reset | reset}). */
  data: TData | null
  /** The last error, normalized to an `Error` instance, or `null` if the last call succeeded (or none has run yet). */
  error: Error | null
  /** The current lifecycle status. */
  status: FetchStatus
  /** Convenience boolean, equivalent to `status === 'loading'`. */
  isLoading: boolean
  /** Convenience boolean, equivalent to `status === 'success'`. */
  isSuccess: boolean
  /** Convenience boolean, equivalent to `status === 'error'`. */
  isError: boolean
  /**
   * Runs `action`. If called with no arguments, falls back to the `args`
   * option (or an empty argument list). Updates `data`/`error`/`status`
   * only while the component is still mounted, but always resolves/rejects
   * with the actual result regardless of mount state.
   */
  execute: (...args: TArgs | []) => Promise<TData>
  /** Resets `data`, `error`, and `status` back to their initial (`null`/`null`/`'idle'`) values. */
  reset: () => void
}

/**
 * A highly reusable, type-safe custom React hook for executing React Server Actions
 * (or any async function, such as an `$fetch`/`createFetch()` call) with built-in
 * state management (loading, error, success states, data).
 *
 * @template TData The type of the data returned by the Server Action.
 * @template TArgs The argument types tuple of the Server Action.
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, execute } = useFetch({
 *   action: (page: number) => api.get<PreordersResponse>('/preorders', { params: { page } }).then(r => r.data),
 * })
 *
 * <button onClick={() => execute(1)} disabled={isLoading}>Load</button>
 * ```
 */
export function useFetch<TData, TArgs extends unknown[]>(
  options: UseFetchOptions<TData, TArgs>
): UseFetchResult<TData, TArgs> {
  const { immediate = false } = options

  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<FetchStatus>('idle')

  const isMounted = useRef<boolean>(true)
  const optionsRef = useRef<UseFetchOptions<TData, TArgs>>(options)

  useEffect(() => {
    optionsRef.current = options
  })

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const execute = useCallback(
    async (...executeArgs: TArgs | []): Promise<TData> => {
      if (isMounted.current) {
        setStatus('loading')
        setError(null)
      }
      const finalArgs = (executeArgs.length > 0
        ? executeArgs
        : (optionsRef.current.args ?? [])) as unknown as TArgs

      try {
        const result = await optionsRef.current.action(...finalArgs)

        if (isMounted.current) {
          setData(result)
          setStatus('success')
          if (optionsRef.current.onSuccess) {
            await optionsRef.current.onSuccess(result)
          }
        }
        return result
      } catch (err) {
        const finalError = err instanceof Error ? err : new Error(String(err))
        if (isMounted.current) {
          setError(finalError)
          setStatus('error')
          if (optionsRef.current.onError) {
            await optionsRef.current.onError(finalError)
          }
        }
        throw finalError
      }
    },
    []
  )

  const initialFetchRef = useRef<boolean>(false)

  useEffect(() => {
    if (immediate && !initialFetchRef.current) {
      initialFetchRef.current = true
      void execute().catch(() => {})
    }
  }, [immediate, execute])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setStatus('idle')
  }, [])

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    reset,
  }
}

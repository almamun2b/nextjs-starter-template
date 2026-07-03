'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseFetchOptions<TData, TArgs extends unknown[]> {
  action: (...args: TArgs) => Promise<TData>
  immediate?: boolean
  args?: TArgs
  onSuccess?: (data: TData) => void | Promise<void>
  onError?: (error: Error) => void | Promise<void>
}

export interface UseFetchResult<TData, TArgs extends unknown[]> {
  data: TData | null
  error: Error | null
  status: FetchStatus
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  execute: (...args: TArgs | []) => Promise<TData>
  reset: () => void
}

/**
 * A highly reusable, type-safe custom React hook for executing React Server Actions
 * with built-in state management (loading, error, success states, data).
 *
 * @template TData The type of the data returned by the Server Action.
 * @template TArgs The argument types tuple of the Server Action.
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

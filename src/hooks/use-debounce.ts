import { useCallback, useEffect, useRef, useState } from 'react'

type DebounceOptions = {
  /** Delay in ms before update/invoke. Default `300`. */
  delayMs?: number
}

/**
 * Debounce a value.
 *
 * Returns a debounced version of `value` that updates only after
 * `delayMs` has passed without changes.
 *
 * @example Debouncing a search input
 * Useful when you want to avoid firing API calls on every keystroke.
 * ```tsx
 * const debouncedSearch = useDebounce(searchTerm, { delayMs: 500 })
 *
 * useEffect(() => {
 *     if (debouncedSearch) {
 *       fetchResults(debouncedSearch)
 *     }
 *   }, [debouncedSearch])
 * ```
 *
 * @typeParam T - Value type.
 * @param value - Value to debounce.
 * @param options - Debounce config.
 * @returns Debounced value.
 */
export function useDebounce<T>(value: T, options?: DebounceOptions): T

/**
 * Debounce a callback.
 *
 * Returns a debounced function that delays invoking `callback`
 * until `delayMs` has elapsed since the last call.
 *
 * @example Debouncing an expensive function call
 * Useful when you want to avoid firing expensive function calls on every event.
 * ```tsx
 * const handler = useDebounce(() => console.log('resize'), { delayMs: 300 })
 * window.addEventListener('resize', handler)
 * ```
 *
 * @typeParam T - Callback type.
 * @param callback - Function to debounce.
 * @param options - Debounce config.
 * @returns Debounced function.
 */
export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  options?: DebounceOptions
): (...args: Parameters<T>) => void

/**
 * Debounce hook implementation.
 *
 * Overloads:
 * - Value → debounced value
 * - Function → debounced function
 *
 * Clears pending timeouts on unmount.
 *
 * @example Value and callback debounce
 * ```tsx
 * // Value debounce
 * const debouncedValue = useDebounce(value, { delayMs: 400 })
 *
 * // Callback debounce
 * const debouncedFn = useDebounce((msg: string) => console.log(msg), { delayMs: 400 })
 * debouncedFn('Hello')
 * ```
 *
 * @typeParam T - Value or callback type.
 * @param valueOrCallback - Value or function.
 * @param options - Debounce config.
 * @returns Debounced value or function.
 */
export function useDebounce<T>(
  valueOrCallback: T,
  { delayMs = 300 }: DebounceOptions = {}
): T | ((...args: never[]) => void) {
  const isFunction = typeof valueOrCallback === 'function'

  const [debouncedValue, setDebouncedValue] = useState(valueOrCallback)

  useEffect(() => {
    if (isFunction) return

    const timeout = setTimeout(() => {
      setDebouncedValue(valueOrCallback)
    }, delayMs)

    return () => clearTimeout(timeout)
  }, [valueOrCallback, delayMs, isFunction])

  const callbackRef = useRef(valueOrCallback)

  useEffect(() => {
    callbackRef.current = valueOrCallback
  }, [valueOrCallback])

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedCallback = useCallback(
    (...args: never[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        const callback = callbackRef.current
        if (typeof callback === 'function') {
          callback(...args)
        }
      }, delayMs)
    },
    [delayMs]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return isFunction ? debouncedCallback : debouncedValue
}

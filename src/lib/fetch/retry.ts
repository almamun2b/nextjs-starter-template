import type { FetchError } from './fetch-error'
import type { RetryOptions } from './types'

type ResolvedRetry = Required<RetryOptions>

const DEFAULT_RETRY: ResolvedRetry = {
  attempts: 0,
  // Only idempotent methods: replaying a POST/PATCH can apply a write twice.
  methods: ['GET', 'HEAD', 'OPTIONS'],
  statusCodes: [408, 429, 502, 503, 504],
  baseDelayMs: 250,
  maxDelayMs: 3_000,
}

/** Normalizes the `retry` option; a number is shorthand for `{ attempts }`. */
export function resolveRetry(
  retry: number | RetryOptions | undefined
): ResolvedRetry {
  if (retry === undefined) return DEFAULT_RETRY
  if (typeof retry === 'number') return { ...DEFAULT_RETRY, attempts: retry }
  return { ...DEFAULT_RETRY, ...retry }
}

/** Seconds or an HTTP date, in ms; `null` when absent or unparseable. */
function parseRetryAfter(response: Response | null): number | null {
  const header = response?.headers.get('Retry-After')
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(header)
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now())
}

/**
 * How long to wait before retry number `attempt` (0-based), or `null` when
 * the failure must not be retried. Honours `Retry-After`, but gives up rather
 * than wait longer than `maxDelayMs`; otherwise exponential backoff with jitter.
 */
export function getRetryDelay(
  error: FetchError,
  attempt: number,
  method: string,
  config: ResolvedRetry
): number | null {
  if (attempt >= config.attempts) return null
  if (!config.methods.includes(method.toUpperCase())) return null

  const retryable =
    error.kind === 'network' ||
    error.kind === 'timeout' ||
    (error.kind === 'http' && config.statusCodes.includes(error.status))
  if (!retryable) return null

  const retryAfter = parseRetryAfter(error.response)
  if (retryAfter !== null) {
    return retryAfter <= config.maxDelayMs ? retryAfter : null
  }

  const backoff = Math.min(config.maxDelayMs, config.baseDelayMs * 2 ** attempt)
  return backoff / 2 + Math.random() * (backoff / 2)
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

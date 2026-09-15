import 'server-only'

import { isAuthEndpoint } from '@/lib/$fetch'
import type { IErrorResponse, IErrors } from '@/types/response.types'
import { unauthorized } from 'next/navigation'
import { FetchError, isFetchError } from './fetch'

/*
 * ---------------------------------------------------------------------------
 * Server Action error contract.
 *
 * Expected failures come back as an `IErrorResponse` value, never as a thrown
 * error: Next.js replaces a thrown error's message in production, so the form
 * could only show "something went wrong". What still throws:
 * - Next.js interrupts (`redirect`, `forbidden`, `notFound`, ...) and bugs —
 *   anything that is not a `FetchError`;
 * - a 401 from a session-protected endpoint after the refresh fallback gave
 *   up, via `unauthorized()`;
 * - an `abort`, which only the caller's own signal can trigger.
 * ---------------------------------------------------------------------------
 */

const isErrorItem = (value: unknown): value is IErrors =>
  !!value && typeof value === 'object' && 'message' in value

/** Whether `data` looks like the backend's error envelope. */
const isErrorResponse = (data: unknown): data is IErrorResponse => {
  if (!data || typeof data !== 'object') return false
  const { message, statusCode } = data as Record<string, unknown>
  return typeof message === 'string' && typeof statusCode === 'number'
}

const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

const buildErrorResponse = (
  error: FetchError,
  statusCode: number,
  code: string,
  message: string
): IErrorResponse => ({
  success: false,
  statusCode,
  code,
  message,
  errors: null,
  timestamp: new Date().toISOString(),
  path: pathOf(error.request.url),
})

/**
 * Copies only the documented envelope fields, so debug fields a backend might
 * add (stack traces, SQL) never reach the browser.
 */
const pickErrorResponse = (
  error: FetchError,
  data: IErrorResponse
): IErrorResponse => ({
  success: false,
  statusCode: data.statusCode,
  code: typeof data.code === 'string' ? data.code : 'HTTP_ERROR',
  message: data.message,
  errors: Array.isArray(data.errors)
    ? data.errors.filter(isErrorItem).map(({ field, message }) => ({
        field: typeof field === 'string' ? field : null,
        message: typeof message === 'string' ? message : null,
      }))
    : null,
  timestamp:
    typeof data.timestamp === 'string'
      ? data.timestamp
      : new Date().toISOString(),
  path: typeof data.path === 'string' ? data.path : pathOf(error.request.url),
})

/** Normalizes a failed backend call into the value a Server Action returns. */
const handleFetchError = (error: unknown): IErrorResponse => {
  if (!isFetchError(error) || error.kind === 'abort') throw error

  switch (error.kind) {
    case 'timeout':
      return buildErrorResponse(
        error,
        504,
        'UPSTREAM_TIMEOUT',
        'The server took too long to respond. Please try again.'
      )
    case 'network':
      return buildErrorResponse(
        error,
        503,
        'SERVICE_UNAVAILABLE',
        'The service is unreachable right now. Please try again shortly.'
      )
    case 'parse':
      return buildErrorResponse(
        error,
        502,
        'BAD_UPSTREAM_RESPONSE',
        'The server sent an unexpected response.'
      )
  }

  if (error.status === 401 && !isAuthEndpoint(error.request.url)) {
    unauthorized()
  }

  return isErrorResponse(error.data)
    ? pickErrorResponse(error, error.data)
    : buildErrorResponse(
        error,
        error.status,
        'HTTP_ERROR',
        `Request failed with status ${error.status}.`
      )
}

export { handleFetchError, isErrorResponse, isFetchError }

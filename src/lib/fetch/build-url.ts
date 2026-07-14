import { serializeParams } from './serialize-params'
import type { QueryParams } from './types'

const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//

/** Whether `url` already includes a scheme (`https://`, `http://`, ...). */
function isAbsoluteUrl(url: string): boolean {
  return ABSOLUTE_URL_REGEX.test(url)
}

/** Joins a base URL and a path with exactly one `/` between them. */
function joinUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '')
  const trimmedPath = path.replace(/^\/+/, '')
  return `${trimmedBase}/${trimmedPath}`
}

/**
 * Builds the final absolute request URL from an input path/URL, an optional
 * `baseUrl`, and optional query {@link QueryParams}.
 *
 * - If `input` is already an absolute URL, `baseUrl` is ignored and `input` is used as-is.
 * - If `input` is relative and no `baseUrl` is configured, throws a clear error
 *   rather than letting the native `fetch` throw an opaque "Invalid URL".
 * - Any query string already present on `input` is preserved and merged with `params`.
 *
 * @param input - An absolute URL, or a path relative to `baseUrl`.
 * @param baseUrl - Base URL to prepend when `input` is relative.
 * @param params - Query parameters to serialize and merge into the URL.
 * @throws {Error} If `input` is relative and no `baseUrl` is provided.
 */
export function buildUrl(
  input: string,
  baseUrl?: string,
  params?: QueryParams
): string {
  let fullUrl: string

  if (isAbsoluteUrl(input)) {
    fullUrl = input
  } else {
    if (!baseUrl) {
      throw new Error(
        `[$fetch] Relative URL "${input}" was provided without a "baseUrl". Pass an absolute URL or configure "baseUrl".`
      )
    }
    fullUrl = joinUrl(baseUrl, input)
  }

  const searchParams = serializeParams(params)
  if ([...searchParams.keys()].length === 0) {
    return fullUrl
  }

  const splitIndex = fullUrl.indexOf('?')
  const pathPart = splitIndex === -1 ? fullUrl : fullUrl.slice(0, splitIndex)
  const existingQuery = splitIndex === -1 ? '' : fullUrl.slice(splitIndex + 1)
  const mergedParams = new URLSearchParams(existingQuery)

  for (const [key, value] of searchParams.entries()) {
    mergedParams.append(key, value)
  }

  const queryString = mergedParams.toString()
  return queryString ? `${pathPart}?${queryString}` : pathPart
}

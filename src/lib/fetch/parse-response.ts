import type { ResponseType } from './types'

/** `application/json`, `application/problem+json`, `application/vnd.api+json`, ... */
const JSON_CONTENT_TYPE = /^application\/(?:[\w.-]+\+)?json\b/i

const hasNoBody = (response: Response): boolean =>
  response.status === 204 ||
  response.status === 205 ||
  response.status === 304 ||
  response.headers.get('Content-Length') === '0' ||
  response.body === null

/**
 * Parses `text` as JSON. A malformed body on a successful response is a real
 * failure (throws `SyntaxError`); on an error response it is kept as text,
 * since proxies routinely answer 502/504 with an HTML page.
 */
const parseJsonText = (text: string, response: Response): unknown => {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (error) {
    if (response.ok) throw error
    return text
  }
}

/**
 * Reads a `Response` body.
 *
 * `auto` (default) picks by `Content-Type`: JSON types → parsed JSON, `text/*`
 * → string, form types → `FormData`, anything else → JSON if it parses, else
 * text. Use an explicit `responseType` for binary payloads (`blob`,
 * `arrayBuffer`) or to stream the body yourself (`stream`) — `auto` would
 * corrupt them by decoding as text.
 *
 * @throws {SyntaxError} When a successful JSON response is malformed.
 */
export async function parseResponseData(
  response: Response,
  responseType: ResponseType = 'auto'
): Promise<unknown> {
  if (responseType === 'stream') return response.body
  if (hasNoBody(response)) return null

  switch (responseType) {
    case 'json':
      return parseJsonText(await response.text(), response)
    case 'text':
      return response.text()
    case 'blob':
      return response.blob()
    case 'arrayBuffer':
      return response.arrayBuffer()
  }

  const contentType = response.headers.get('Content-Type') ?? ''

  if (JSON_CONTENT_TYPE.test(contentType)) {
    return parseJsonText(await response.text(), response)
  }
  if (contentType.startsWith('text/')) {
    return response.text()
  }
  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    return response.formData()
  }

  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** `data.message` when the parsed body is an object with a string `message`. */
export function extractMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message?: unknown }
    return typeof message === 'string' ? message : null
  }
  return null
}

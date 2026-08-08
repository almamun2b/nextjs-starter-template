import { NextResponse } from 'next/server'
import { parseSetCookie } from 'set-cookie-parser'
import { callRefreshEndpoint, parseCookieHeader } from '@/lib/auth-refresh'

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`

type RetryBody = {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Merges a refresh response's `Set-Cookie` values into the incoming cookie
 * header so a retried request carries the freshly-rotated tokens.
 */
const mergeRefreshedCookies = (
  cookie: string,
  setCookies: string[]
): string => {
  const map = parseCookieHeader(cookie)

  for (const parsed of parseSetCookie(setCookies, { decodeValues: true })) {
    map[parsed.name] = parsed.value
  }

  return Object.entries(map)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

const forward = async (
  path: string,
  method: string,
  cookie: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<Response> =>
  fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

/**
 * POST /api/retry
 *
 * Generic authenticated proxy with automatic refresh-and-retry. Route
 * Handlers are always in a mutable cookie phase, so this endpoint can refresh
 * an expired access token, persist the new cookies, and transparently retry
 * the original request — even when the caller itself is in a read-only
 * context (Server Component render).
 *
 * Request body:
 * ```json
 * { "path": "/users/me", "method": "GET", "body": null, "headers": {} }
 * ```
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RetryBody | null
  const cookie = request.headers.get('cookie') ?? ''

  if (!body?.path) {
    return NextResponse.json(
      { success: false, message: 'path is required' },
      { status: 400 }
    )
  }

  const method = body.method ?? 'GET'

  let response: Response | null = null

  try {
    response = await forward(body.path, method, cookie, body.body, body.headers)
  } catch {
    return NextResponse.json(
      { success: false, message: 'Upstream request failed' },
      { status: 502 }
    )
  }

  if (response.status === 401) {
    try {
      const refreshResponse = await callRefreshEndpoint(cookie)
      const refreshedCookies = refreshResponse.headers.getSetCookie?.() ?? []
      const freshCookie = mergeRefreshedCookies(cookie, refreshedCookies)

      response = await forward(
        body.path,
        method,
        freshCookie,
        body.body,
        body.headers
      )
    } catch {
      // Refresh failed — keep the original 401 response below.
    }
  }

  const data = await response.json().catch(() => null)
  const result = NextResponse.json(data, { status: response.status })

  for (const setCookie of response.headers.getSetCookie?.() ?? []) {
    result.headers.append('Set-Cookie', setCookie)
  }

  return result
}

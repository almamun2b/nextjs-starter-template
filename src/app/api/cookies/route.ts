import { NextResponse } from 'next/server'

/**
 * POST /api/cookies
 *
 * Generic cookie relay. Applies an arbitrary list of raw `Set-Cookie`
 * strings onto its response so HttpOnly cookies can be persisted from the
 * browser even when the token values were received outside of a `Set-Cookie`
 * header (e.g. in a JSON body). Called client-side:
 *
 * ```ts
 * await fetch('/api/cookies', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ setCookies: ['accessToken=...; HttpOnly; ...'] }),
 * })
 * ```
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    setCookies?: unknown
  } | null

  const setCookies = Array.isArray(body?.setCookies)
    ? (body?.setCookies as string[])
    : []

  const result = NextResponse.json({
    success: true,
    applied: setCookies.length,
  })

  for (const setCookie of setCookies) {
    result.headers.append('Set-Cookie', setCookie)
  }

  return result
}

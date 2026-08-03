import { callRefreshEndpoint } from '@/lib/auth-refresh'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/refresh
 *
 * Same-origin refresh endpoint. Reads the `refreshToken` cookie from the
 * incoming request, calls the backend `/auth/refresh-token` endpoint, and
 * forwards every backend `Set-Cookie` header onto its own response.
 *
 * Route Handlers are always in a mutable cookie phase, so this is the one
 * place a token refresh can *always* persist its cookies — whether it is
 * called from the browser (cookies land automatically) or server-to-server
 * (the caller relays the returned `Set-Cookie` headers).
 */
export async function POST(request: Request) {
  const cookie = request.headers.get('cookie') ?? ''

  try {
    const response = await callRefreshEndpoint(cookie)
    const data = await response.json().catch(() => null)

    const result = NextResponse.json(data, { status: response.status })

    for (const setCookie of response.headers.getSetCookie?.() ?? []) {
      result.headers.append('Set-Cookie', setCookie)
    }

    return result
  } catch {
    return NextResponse.json(
      { success: false, message: 'Token refresh failed' },
      { status: 500 }
    )
  }
}

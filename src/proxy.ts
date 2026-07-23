import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const publicRoutes = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
])

const authRoutes = new Set(['/dashboard', '/profile', '/settings', '/users'])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get('refreshToken')?.value

  const isAuthenticated = !!refreshToken

  if (isAuthenticated && publicRoutes.has(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (
    !isAuthenticated &&
    Array.from(authRoutes).some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}

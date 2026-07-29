import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || 'secret'

const getSession = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) return null

  try {
    const payload = jwt.verify(token, accessTokenSecret)
    if (!payload || typeof payload === 'string') {
      return null
    }
    return payload
  } catch {
    return null
  }
}

const getIsLoggedIn = async (): Promise<boolean> => {
  const session = await getSession()
  return !!session
}

/**
 * Removes the session cookie.
 *
 * Works in Route Handlers and Server Actions where cookies are mutable.
 */
const deleteSessionCookies = async (): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
}

/**
 * For server actions / server components
 * cookies() is read-only here, so you must return Set-Cookie headers
 */
const removeSessionResponse = (): Response => {
  return new Response('Logged out', {
    status: 200,
    headers: {
      'Set-Cookie': [
        'accessToken=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Strict',
        'refreshToken=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Strict',
      ].join(', '),
    },
  })
}

export {
  deleteSessionCookies,
  getIsLoggedIn,
  getSession,
  removeSessionResponse,
}

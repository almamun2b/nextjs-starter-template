import { IUser } from '@/types/user.types'
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import { cookies } from 'next/headers'

type TokenUser = Pick<IUser, 'id' | 'email' | 'role'>

const SESSION_COOKIE = 'session'
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'SessionSecret'

const generateToken = (
  payload: string | object | Buffer,
  secret: Secret | jwt.PrivateKey,
  expiresIn: number
) => {
  const token = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
  })
  return token
}

const createJwtPayload = (user: TokenUser): JwtPayload => ({
  userId: user.id,
  email: user.email,
  role: user.role,
})

const createSession = async (
  user: TokenUser,
  accessToken?: string
): Promise<void> => {
  const cookieStore = await cookies()
  const token = accessToken ?? cookieStore.get('accessToken')?.value
  if (!token) {
    throw new Error('Access token not found')
  }
  const decoded = jwt.decode(token)
  if (!decoded || typeof decoded === 'string' || !decoded?.exp) {
    throw new Error('Access token does not contain exp claim')
  }

  const nowSec = Math.floor(Date.now() / 1000)
  const ttl = decoded.exp - nowSec

  if (ttl <= 0) {
    throw new Error('Access token has expired.')
  }

  const sessionToken = generateToken(
    createJwtPayload(user),
    SESSION_SECRET,
    ttl
  )
  const expMs = decoded.exp * 1000

  cookieStore.set({
    name: SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    expires: new Date(expMs),
  })
}

const getSession = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  try {
    const payload = jwt.verify(token, SESSION_SECRET)
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
const deleteSessionCookie = async (): Promise<void> => {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/**
 * For server actions / server components
 * cookies() is read-only here, so you must return Set-Cookie headers
 */
const removeSessionResponse = (): Response => {
  return new Response('Logged out', {
    status: 200,
    headers: {
      'Set-Cookie':
        'session=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Strict',
    },
  })
}

export {
  createSession,
  deleteSessionCookie,
  getIsLoggedIn,
  getSession,
  removeSessionResponse,
}

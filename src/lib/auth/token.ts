import jwt, { type JwtPayload } from 'jsonwebtoken'

/*
 * ---------------------------------------------------------------------------
 * Access-token verification.
 *
 * Deliberately free of `next/headers` and of any `$fetch` import so that
 * `src/proxy.ts` can use it. Proxy runs on the Node.js runtime in Next.js 16
 * (and the runtime is not configurable), so `jsonwebtoken` works there — there
 * is no need for an Edge-compatible verifier.
 *
 * The three-way result matters: an *expired* token is not the same as an
 * invalid one. An expired access token alongside a refresh token is the normal
 * mid-session state that `$fetch`'s silent refresh exists to handle, and the
 * proxy must not treat it as a logout.
 * ---------------------------------------------------------------------------
 */

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'secret'

/**
 * `userId` / `email` / `role` come from the module augmentation in
 * `src/types/global.d.ts`, which is the single declaration of what the backend
 * puts in the token. `role` arrives as the enum's string key, so read it
 * through `readUserRole` before comparing.
 */
type IAccessTokenClaims = JwtPayload

type TVerifyResult =
  | { status: 'valid'; claims: IAccessTokenClaims }
  | { status: 'expired' }
  | { status: 'invalid' }

const verifyAccessToken = (token: string | undefined | null): TVerifyResult => {
  if (!token) return { status: 'invalid' }

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET)
    if (!payload || typeof payload === 'string') {
      return { status: 'invalid' }
    }
    return { status: 'valid', claims: payload as IAccessTokenClaims }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { status: 'expired' }
    }
    return { status: 'invalid' }
  }
}

export { verifyAccessToken, type IAccessTokenClaims, type TVerifyResult }

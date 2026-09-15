import z from 'zod/v3'

/*
 * ---------------------------------------------------------------------------
 * Server environment.
 *
 * Read in one place so a missing or malformed value fails with a message that
 * names the variable, instead of an opaque `Invalid URL` deep in an import.
 * Free of `next/headers` and `server-only` so `src/proxy.ts` can use it.
 * ---------------------------------------------------------------------------
 */

const DEFAULT_API_URL = 'http://localhost:5000'

const urlSchema = z
  .string()
  .url()
  .transform((value) => value.replace(/\/+$/, ''))

/**
 * Backend origin for server-to-server calls. `API_URL` (server-only) wins so
 * production can use an internal hostname without shipping it to the browser;
 * `NEXT_PUBLIC_API_URL` stays as the fallback for existing setups.
 */
const resolveApiUrl = (): string => {
  const raw =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
  const parsed = urlSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `[env] API_URL / NEXT_PUBLIC_API_URL must be an absolute URL, got "${raw}".`
    )
  }
  return parsed.data
}

const API_URL = resolveApiUrl()

/** Base for every backend endpoint, e.g. `http://localhost:5000/api/v1`. */
const API_BASE_URL = `${API_URL}/api/v1`

/**
 * Secret the proxy verifies access tokens with. Read lazily so `next build`
 * works without it, but never falls back to a default: a guessable secret
 * would let anyone mint a token the proxy accepts.
 */
const getAccessTokenSecret = (): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET
  if (!secret) {
    throw new Error(
      '[env] ACCESS_TOKEN_SECRET is not set. It must match the backend signing secret.'
    )
  }
  return secret
}

export { API_BASE_URL, API_URL, getAccessTokenSecret }

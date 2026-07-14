import { cookies } from 'next/headers'
import setCookieParser from 'set-cookie-parser'
import { createFetch } from './fetch'
import { FetchError } from './fetch/fetch-error'

// Deduplication promise for concurrent 401 errors
let refreshPromise: Promise<void> | null = null

const $fetch = createFetch({
  // baseUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/server`, //While using rewrites
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',

  onRequest: async (req) => {
    // Forward the client's HttpOnly cookies to the downstream backend.
    const cookieStore = await cookies()
    const cookieString = cookieStore.toString()

    if (cookieString) {
      const headers = new Headers(req.init.headers)
      headers.set('Cookie', cookieString)
      req.init.headers = headers
    }

    return req
  },

  onResponse: async (res) => {
    // Forward any Set-Cookie headers from the backend back to the browser.
    const setCookieHeaders = res.headers.getSetCookie?.() ?? []

    if (setCookieHeaders.length > 0) {
      const parsedCookies = setCookieParser.parse(setCookieHeaders, {
        decodeValues: true,
      })

      const cookieStore = await cookies()

      for (const cookie of parsedCookies) {
        const options: Parameters<typeof cookieStore.set>[2] = {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
          path: cookie.path,
          maxAge: cookie.maxAge,
          expires: cookie.expires,
          // domain, priority, etc. can be added if needed
        }

        try {
          cookieStore.set(cookie.name, cookie.value, options)
        } catch {
          // Silently ignore — cookies().set() throws when called inside a
          // Server Component render (read-only context). It works fine in
          // Server Actions and Route Handlers.
        }
      }
    }

    return res
  },

  onError: async (error: unknown) => {
    // Auto-refresh on 401 errors
    if (error instanceof FetchError && error.status === 401) {
      // Deduplicate refresh calls to prevent multiple concurrent refreshes
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            // Call refresh endpoint directly using native fetch to avoid circular dependency
            const refreshUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/server/auth/refresh-token`
            const cookieStore = await cookies()
            const cookieString = cookieStore.toString()

            const headers: HeadersInit = {
              'Content-Type': 'application/json',
            }
            if (cookieString) {
              headers['Cookie'] = cookieString
            }

            const response = await fetch(refreshUrl, {
              method: 'POST',
              headers,
              credentials: 'include',
            })

            // Forward Set-Cookie headers from refresh response using robust parser
            const setCookieHeaders = response.headers.getSetCookie?.() ?? []
            if (setCookieHeaders.length > 0) {
              const parsedCookies = setCookieParser.parse(setCookieHeaders, {
                decodeValues: true,
              })

              for (const cookie of parsedCookies) {
                const options: Parameters<typeof cookieStore.set>[2] = {
                  httpOnly: cookie.httpOnly,
                  secure: cookie.secure,
                  sameSite: cookie.sameSite as
                    | 'lax'
                    | 'strict'
                    | 'none'
                    | undefined,
                  path: cookie.path,
                  maxAge: cookie.maxAge,
                  expires: cookie.expires,
                }

                try {
                  cookieStore.set(cookie.name, cookie.value, options)
                } catch {
                  // Silently ignore
                }
              }
            }

            if (!response.ok) {
              throw new Error(`Token refresh failed: ${response.status}`)
            }

            console.log('[fetch] Token refreshed successfully')
          } catch (refreshError) {
            console.error('[fetch] Token refresh failed:', refreshError)
            throw refreshError
          }
        })().finally(() => {
          refreshPromise = null
        })
      }

      try {
        await refreshPromise
      } catch {
        // Refresh failed - rethrow the original 401 error
        throw error
      }

      // Refresh succeeded - rethrow the original 401 error so caller can retry
      throw error
    }

    console.error('Fetch error:', error)
    throw error
  },
})

export { $fetch }

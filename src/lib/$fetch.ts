import { IResponse } from '@/types/response.types'
import { cookies } from 'next/headers'
import { parseSetCookie } from 'set-cookie-parser'
import { createFetch } from './fetch'
import { FetchError } from './fetch/fetch-error'

type SameSite = 'lax' | 'strict' | 'none' | undefined

// Deduplication promise for concurrent 401 errors
let refreshPromise: Promise<void> | null = null
const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1` // `${process.env.NEXT_PUBLIC_SITE_URL}/server`, //While using rewrites
const refreshUrl = `${baseUrl}/auth/refresh-token`

const $fetch = createFetch({
  baseUrl: baseUrl,
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
      const parsedCookies = parseSetCookie(setCookieHeaders, {
        decodeValues: true,
      })
      const cookieStore = await cookies()

      for (const cookie of parsedCookies) {
        const { name, value, ...rest } = cookie
        const options: Parameters<typeof cookieStore.set>[2] = {
          ...rest,
          sameSite: rest.sameSite as SameSite,
        }
        try {
          cookieStore.set(name, value, options)
        } catch {
          // Silently ignore — cookies().set() throws when called inside a
          // Server Component render (read-only context). It works fine in
          // Server Actions and Route Handlers.
        }
      }
    }

    return res
  },

  onError: async (error) => {
    // Auto-refresh on 401 errors
    if (error instanceof FetchError && error.status === 401) {
      // Deduplicate refresh calls to prevent multiple concurrent refreshes
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            // Call refresh endpoint directly using native fetch to avoid circular dependency
            const cookieStore = await cookies()
            const cookieString = cookieStore.toString()
            const refreshTokenCookie = cookieStore.get('refreshToken')

            if (!refreshTokenCookie?.value?.trim()) {
              console.warn(
                '[fetch]: Refresh skipped because refreshToken is missing or empty'
              )
              throw error
            }

            const headers = new Headers({
              'Content-Type': 'application/json',
            })

            if (cookieString) {
              headers.set('Cookie', cookieString)
            }

            const response = await fetch(refreshUrl, {
              method: 'POST',
              headers,
              credentials: 'include',
            })

            // Forward Set-Cookie headers from refresh response using robust parser
            const setCookieHeaders = response.headers.getSetCookie?.() ?? []
            if (setCookieHeaders.length > 0) {
              const parsedCookies = parseSetCookie(setCookieHeaders, {
                decodeValues: true,
              })

              for (const cookie of parsedCookies) {
                const { name, value, ...rest } = cookie
                const options: Parameters<typeof cookieStore.set>[2] = {
                  ...rest,
                  sameSite: rest.sameSite as SameSite,
                }
                try {
                  cookieStore.set(name, value, options)
                } catch {
                  // Silently ignore
                }
              }
            }

            const refreshResult: IResponse = await response.json()
            if (!response.ok) {
              throw new FetchError({
                data: refreshResult,
                response,
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url,
                message: refreshResult.message,
              })
            }

            console.log(`[fetch]: ${refreshResult.message}`)
          } catch (refreshError) {
            console.error(`[fetch]: ${(refreshError as FetchError).message}`)
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

    throw error
  },
})

export { $fetch }

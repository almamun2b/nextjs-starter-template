## Handling HttpOnly Cookie Authentication

If your backend issues `accessToken` and `refreshToken` via **HttpOnly cookies**, you must handle this differently depending on whether the request is made from the **Client** (Browser) or the **Server** (Server Components / Server Actions).

### 1. Client-Side (Browser) Requests

On the client side, the browser automatically sends and receives cookies. You only need to set `credentials: 'include'` so that cross-origin requests include the cookies:

```ts
import { createFetch } from '@/lib/fetch'

export const clientApi = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include', // Ensure browser cookies are sent and Set-Cookie is honored
})
```

### 2. Server-Side (Next.js Server Components / Actions)

When Next.js renders a Server Component or executes a Server Action, it runs on the Node.js server. The native `fetch` on the server **does not automatically forward** the client's browser cookies to your backend API.

You must manually forward the incoming cookies using `next/headers`:

```ts
import { createFetch } from '@/lib/fetch'
import { cookies } from 'next/headers'

export const serverApi = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  onRequest: async (req) => {
    // 1. Get the cookies from the current incoming client request
    const cookieStore = await cookies()
    const cookieString = cookieStore.toString()

    if (cookieString) {
      const headers = new Headers(req.init.headers)
      // 2. Forward the Cookie header to the downstream backend API
      headers.set('Cookie', cookieString)
      req.init.headers = headers
    }

    return req
  },
  onResponse: async (res) => {
    // 3. Forward any Set-Cookie headers from the backend back to the browser.
    //    This handles transparent cookie rotation (e.g. refreshed access tokens).
    //    Note: cookies().set() is only effective inside Server Actions / Route Handlers.
    const setCookieHeaders = res.headers.getSetCookie?.() ?? []

    if (setCookieHeaders.length > 0) {
      const cookieStore = await cookies()
      for (const raw of setCookieHeaders) {
        const [pair, ...attrs] = raw.split(';').map((part) => part.trim())
        const eqIndex = pair.indexOf('=')
        const name = pair.slice(0, eqIndex)
        const value = pair.slice(eqIndex + 1)

        const options: Parameters<typeof cookieStore.set>[2] = {}
        for (const attr of attrs) {
          const [key, val] = attr.split('=')
          switch (key.toLowerCase()) {
            case 'httponly':
              options.httpOnly = true
              break
            case 'secure':
              options.secure = true
              break
            case 'samesite':
              options.sameSite = val?.toLowerCase() as 'lax' | 'strict' | 'none'
              break
            case 'path':
              options.path = val
              break
            case 'max-age':
              options.maxAge = Number(val)
              break
          }
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
})
```

> **Note:** `cookies().set()` from `next/headers` throws when called inside a Server Component's render (read-only context). The `onResponse` cookie-write logic is silently ignored there — it only takes effect inside Server Actions and Route Handlers.

---

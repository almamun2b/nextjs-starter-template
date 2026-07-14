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
    // 3. Optional: Forward 'Set-Cookie' header back to the client if the backend rotates/refreshes cookies
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      const cookieStore = await cookies()
      // You can parse setCookie and set them in the next/headers cookie store so they are sent to the client browser.
      // Note: Setting cookies is only allowed in Server Actions or Route Handlers, not in Server Components.
    }
    return res
  },
})
```

---

# Auth Documentation

> How authentication works in `nextjs-starter-template`: token model, cookie handling, the
> two-layer refresh architecture, and the pieces involved.
>
> See [auth-flow.md](./auth-flow.md) for step-by-step, function-call-by-function-call traces.
> Last updated: 2026-08-03

## 1. Model: HttpOnly JWT cookies

Two JWTs, stored in **HttpOnly cookies** only (never `localStorage`, never client state):

| Cookie         | Contents                 | Purpose                             |
| -------------- | ------------------------ | ----------------------------------- |
| `accessToken`  | short-lived access JWT   | authorizes every authenticated call |
| `refreshToken` | longer-lived refresh JWT | exchanged for a new access token    |

The backend authenticates requests by reading the **`Cookie: accessToken=...` header**, not an
`Authorization: Bearer` header.

Cookie flags set by the backend (`setAuthCookies`):

- `HttpOnly` — tokens invisible to JS
- `Secure` in production, off in dev (`http://localhost`)
- `SameSite=Lax` (production) / `None` (dev, cross-origin localhost)
- `Path=/`

## 2. The hard rule: cookie-writable vs read-only contexts

`cookies()` from `next/headers` is **read-only during Server Component renders** and writable in
**Server Actions and Route Handlers**. This single constraint drives the whole architecture:

| Context                  | Can set cookies? | Where refresh happens              |
| ------------------------ | ---------------- | ---------------------------------- |
| Proxy (middleware)       | ✅ (via headers) | silent refresh on page loads       |
| Server Action            | ✅               | `$fetch.onError` → refresh + retry |
| Route Handler (`/api/*`) | ✅               | `$fetch.onError` → refresh + retry |
| Server Component render  | ❌ read-only     | **cannot** refresh in-render       |

`isCookieWritable()` probes write-ability by setting a throwaway cookie and reading it back.
`refreshTokens()` **skips entirely** when the context is read-only — rotating the refresh token
without persisting the new one would log the user out.

## 3. Backend contract

Backend: `express-postgrsql-starter`, base URL `{NEXT_PUBLIC_API_URL}` (default
`http://localhost:5000`), API under `/api/v1`.

Auth-relevant endpoints:

| Method & Path                       | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `POST /api/v1/auth/login`           | login, sets both cookies via `Set-Cookie` |
| `POST /api/v1/auth/register`        | signup, sets cookies on success           |
| `POST /api/v1/auth/refresh-token`   | rotate `refreshToken` → new pair          |
| `POST /api/v1/auth/forgot-password` | send reset email                          |
| `POST /api/v1/auth/reset-password`  | set new password                          |
| `POST /api/v1/auth/verify-email`    | verify email token                        |
| `GET /api/v1/users/me`              | current profile (needs `accessToken`)     |
| `PATCH /api/v1/users/me`            | update current profile                    |

Backend refresh behavior (`auth.service.ts` `refreshToken`, ~line 225):

1. Reads `req.cookies?.refreshToken`.
2. Verifies signature with `env.jwt.refreshTokenSecret`, checks expiry and user existence.
3. Checks the **Redis blacklist** (prevents refresh-token replay after rotation).
4. Creates a new token pair via `createUserTokens`.
5. Responds with `Set-Cookie` headers for the new pair.

> ⚠️ Because the backend reads `req.cookies`, the refresh request must send only the
> `refreshToken` cookie. `callRefreshEndpoint` therefore sends
> `Cookie: refreshToken=${refreshToken}` explicitly.

## 4. Two-layer refresh architecture

Refresh is handled in exactly two places, each in a context where it can persist cookies:

### Layer 1 — Proxy (page loads)

`src/proxy.ts` runs before Server Components render, so it is the only place a **page load** can
refresh an expired access token (renders are read-only for cookies).

- Only **GET** requests are refreshed here; non-GET (Server Actions / Route Handlers) are left
  alone so in-flight mutations aren't hijacked by a redirect.
- On success it 302-redirects to `?tokenRefreshed=true` and appends the backend's `Set-Cookie`
  headers; the browser stores the new tokens, and the follow-up request (where the tag is
  stripped) renders normally.
- On failure it redirects to `/login?redirect=<pathname>`.

### Layer 2 — `$fetch.onError` (Server Actions / Route Handlers / server-side fetches)

In `src/lib/$fetch.ts`, on any `401` from the backend (except `NO_REFRESH_PATHS`):

1. `refreshTokens()` calls the backend refresh endpoint with only the `refreshToken` cookie.
2. If new cookies landed (`ok && applied`), `retry()` re-runs the original request once with the
   fresh cookies.
3. If refresh fails, the original `FetchError` propagates to the caller.

`refreshTokens()` is deduped by refresh-token value, so concurrent 401s share a single refresh.

### Endpoints that must never auto-refresh

`NO_REFRESH_PATHS` (401 on these means bad credentials, not an expired token):

```
/auth/login, /auth/register, /auth/forgot-password,
/auth/reset-password, /auth/verify-email, /auth/refresh-token
```

## 5. Same-origin helper endpoints

These Route Handlers exist so browser-driven or server-to-server flows can persist cookies through
the frontend origin:

| Endpoint                 | Behavior                                                       |
| ------------------------ | -------------------------------------------------------------- |
| `POST /api/auth/refresh` | proxy refresh call; relays backend `Set-Cookie` to the browser |
| `POST /api/cookies`      | generic `Set-Cookie` relay (browser → handler → backend)       |
| `POST /api/retry`        | refresh-and-retry proxy for a cached request                   |

They are used in the browser → frontend → backend chain and are always in a writable cookie phase.

## 6. Key files

| File                                            | Role                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/proxy.ts`                                  | route guard + silent page-load refresh                                                             |
| `src/lib/$fetch.ts`                             | auth-aware fetch instance (`onRequest/onResponse/onError`)                                         |
| `src/lib/auth-refresh.ts`                       | `refreshTokens`, `applySetCookies`, `isCookieWritable`, `callRefreshEndpoint`, `parseCookieHeader` |
| `src/app/actions/auth.ts`                       | Server Actions: login, logout, signup, verify, reset                                               |
| `src/app/actions/user.ts`                       | Server Actions: `me`, `updateMyProfile`, user CRUD                                                 |
| `src/app/api/auth/refresh/route.ts`             | same-origin refresh helper                                                                         |
| `src/app/api/cookies/route.ts`                  | generic `Set-Cookie` relay                                                                         |
| `src/app/api/retry/route.ts`                    | refresh-and-retry proxy                                                                            |
| `src/lib/error.ts`                              | `handleFetchError` (rethrows 401), `isFetchError`                                                  |
| `src/components/modules/auth/logout-button.tsx` | logout trigger (client)                                                                            |
| `src/components/modules/auth/login-form.tsx`    | login form (react-hook-form)                                                                       |
| `src/validation/`                               | Zod schemas shared by forms + actions                                                              |
| `src/constant/tags.ts`                          | `CACHE_TAGS.PROFILE` for revalidation                                                              |

## 7. The full picture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      BROWSER                          │
                    │   HttpOnly cookies: accessToken, refreshToken          │
                    └───────────────┬────────────────────────────────────────┘
                                    │ GET /dashboard        │ Server Action
                                    ▼                       ▼
                    ┌──────────────────────────┐  ┌──────────────────────────────┐
                    │ src/proxy.ts             │  │ Server Action                │
                    │  token expired?          │  │  $fetch.post(...)             │
                    │  yes → refresh + 302     │  │   │ 401                      │
                    │  tokenRefreshed=true     │  │   ▼                          │
                    └──────────────┬───────────┘  │  onError: refreshTokens()    │
                                   │ follow-up    │  retry() once                │
                                   ▼              │  revalidateTag on success    │
                    ┌──────────────────────────┐  └──────────────┬───────────────┘
                    │ RSC render (read-only)   │                 │ Cookie header
                    │  me() may 401 → .catch()│                 ▼
                    └──────────────────────────┘  ┌──────────────────────────────┐
                                                 │ Backend (Express)             │
                                                 │  /api/v1/*  checks            │
                                                 │  Cookie: accessToken          │
                                                 │  replies Set-Cookie           │
                                                 └──────────────────────────────┘
```

## 8. Security notes & rules

- Tokens never touch `localStorage`; keep it that way (no moving refresh handling client-side).
- Only the `refreshToken` cookie is sent to the refresh endpoint — never the access token.
- `refreshTokens()` refuses to run in read-only contexts; do not "fix" this by forcing a refresh
  during render — route it through the Proxy or a Server Action instead.
- The proxy refreshes only GET requests; never add mutation paths to it.
- Keep `HttpOnly` + `Secure` (prod) flags on both cookies; backend sets them in `setAuthCookies`.
- Server Components that call authenticated actions should expect a possible `401` and use
  `.catch()` for a fallback UI (see `profile/page.tsx`).

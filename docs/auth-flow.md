# Auth Flow — Function-Call by Function-Call

> What actually happens, step by step, in each auth scenario: which function calls which, in
> which context (Server Action / Server Component / Proxy / Route Handler), and what each hop
> does with cookies.
>
> Companion docs: [architecture.md](./architecture.md), [auth.md](./auth.md).
> Last updated: 2026-08-03

## Legend

- `(server action)` — runs server-side in a **writable** cookie context
- `(RSC render)` — runs during Server Component render, **read-only** cookies
- `(proxy)` — Next.js Proxy / middleware, before the router
- `(route handler)` — `app/api/*` handler, writable cookies
- `(client)` — runs in the browser
- 🔑 = cookie mutation (set / clear / relay)

---

## Flow 1 — Login

**Trigger:** user submits the login form on `/login`.

| #   | Context           | Function call                                                                  | What happens                                                                                                                                  |
| --- | ----------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `(client)`        | `LoginForm` (react-hook-form) validates with the Zod `loginSchema`, then calls | —                                                                                                                                             |
| 2   | `(server action)` | `loginUser(data)` — `src/app/actions/auth.ts`                                  | receives `TLoginInput`; opens a writable cookie context                                                                                       |
| 3   | `(server action)` | `$fetch.post<TUserResponse, TLoginInput>('/auth/login', { body: data })`       | delegates to the shared instance (`src/lib/$fetch.ts`)                                                                                        |
| 4   | `(lib)`           | `baseFetch` → `onRequest`                                                      | reads `cookies()` and forwards the current `Cookie` header to the backend                                                                     |
| 5   | `(lib)`           | `fetch → POST {API_URL}/api/v1/auth/login`                                     | **network hop** — backend verifies credentials, creates tokens (`createUserTokens`), replies with `Set-Cookie: accessToken=…; refreshToken=…` |
| 6   | `(lib)`           | `onResponse` → `applySetCookies()` 🔑                                          | parses backend `Set-Cookie` headers and applies them to the browser response — the browser now holds the two HttpOnly tokens                  |
| 7   | `(server action)` | `revalidateTag(CACHE_TAGS.PROFILE, 'max')`                                     | clears any cached profile data                                                                                                                |
| 8   | `(server action)` | `loginUser` returns `TUserResponse`                                            | success payload (`user`, `accessToken` in body — used by the form only for UI state, never stored)                                            |
| 9   | `(client)`        | `LoginForm` receives `{ success, data }` → `router.push('/dashboard')`         | redirect into the protected area                                                                                                              |

**Cookies after this flow:** `accessToken` + `refreshToken` (HttpOnly).

---

## Flow 2 — Protected page load (valid access token)

**Trigger:** authenticated browser navigates to `GET /dashboard`.

| #   | Context        | Function call                                                                                                                                                   | What happens                                                                              |
| --- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `(proxy)`      | `src/proxy.ts` runs (matcher excludes `/api/*`, `_next/*`, static)                                                                                              | URL has no `tokenRefreshed` tag → not stripped                                            |
| 2   | `(proxy)`      | `getTokenExpiry(req)`                                                                                                                                           | decodes the `accessToken` JWT payload **locally** (`base64url`, no secret), returns `exp` |
| 3   | `(proxy)`      | `isAccessTokenExpired(exp)`                                                                                                                                     | `exp * 1000 <= Date.now()` → **false**, token is valid                                    |
| 4   | `(proxy)`      | route guard: user authenticated + path protected → **pass through**                                                                                             | request proceeds to the router untouched                                                  |
| 5   | `(RSC render)` | `(dashboard)/layout.tsx` renders (currently a hardcoded user — see [architecture.md §8](./architecture.md#8-known-notes--caveats)); `Sidebar` / `Header` render |                                                                                           |
| 6   | `(RSC render)` | `Header` → `getIsLoggedIn()` (`src/lib/session.ts`)                                                                                                             | verifies `accessToken` against `ACCESS_TOKEN_SECRET`; shows logged-in UI                  |

**No cookie changes.**

---

## Flow 3 — Protected page load (expired access token) → proxy refresh

**Trigger:** access token has expired but `refreshToken` is still valid.

| #   | Context        | Function call                                                | What happens                                                                                                                                                                       |
| --- | -------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `(proxy)`      | `src/proxy.ts` runs                                          |                                                                                                                                                                                    |
| 2   | `(proxy)`      | `getTokenExpiry(req)` → `isAccessTokenExpired(exp)`          | **true** — token expired (or missing)                                                                                                                                              |
| 3   | `(proxy)`      | check: is it a **GET** + is a `refreshToken` cookie present? | yes to both → refresh path is allowed                                                                                                                                              |
| 4   | `(proxy)`      | `tryRefreshTokens(req)`                                      | server-side `fetch` to `POST {API_URL}/api/v1/auth/refresh-token` with header `Cookie: refreshToken=${refreshToken}` (only the refresh token — the access token is expired anyway) |
| 5   | `(backend)`    | `refreshToken` handler                                       | verifies refresh JWT with `env.jwt.refreshTokenSecret`, checks the Redis blacklist, rotates tokens, replies `Set-Cookie: accessToken=…; refreshToken=…`                            |
| 6   | `(proxy)`      | refresh `ok` → build response                                | constructs a `302 Redirect` to `/dashboard?tokenRefreshed=true` and **copies the backend `Set-Cookie` headers onto it** 🔑                                                         |
| 7   | `(browser)`    | receives 302 + `Set-Cookie`                                  | stores the new token pair; follows the redirect                                                                                                                                    |
| 8   | `(proxy)`      | `GET /dashboard?tokenRefreshed=true`                         | **tag detected** → `302` redirect to the clean URL `/dashboard` (no cookies — the tag exists to force a fresh request)                                                             |
| 9   | `(RSC render)` | `GET /dashboard` renders now with valid tokens               | identical to Flow 2, steps 5–6                                                                                                                                                     |

**Failure branch (refresh rejected / no refresh token):**

- `tryRefreshTokens` returns no usable `Set-Cookie`, or there is no `refreshToken` cookie at all
  → `302` redirect to `/login?redirect=/dashboard` (preserves the intended destination).

**Non-GET note:** a `POST`/`PATCH`/… to a protected route is never refreshed by the proxy — it is
handled by Flow 4 instead, so in-flight mutations aren't hijacked by a redirect.

---

## Flow 4 — Server Action hits 401 → in-app refresh + retry

**Trigger:** a Server Action (writable context) calls the backend with an expired access token,
e.g. `me()` in `src/app/actions/user.ts`.

| #   | Context           | Function call                                                           | What happens                                                                                                 |
| --- | ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | `(server action)` | `me()` → `$fetch.get<TUserResponse>('/users/me')`                       |                                                                                                              |
| 2   | `(lib)`           | `baseFetch` → `onRequest`                                               | forwards `Cookie` header (contains the **expired** `accessToken`)                                            |
| 3   | `(backend)`       | `GET /api/v1/users/me`                                                  | verifies token → **401 Unauthorized**                                                                        |
| 4   | `(lib)`           | `FetchError` thrown (status 401)                                        |                                                                                                              |
| 5   | `(lib)`           | `onError(error, retry)` fires                                           | path is **not** in `NO_REFRESH_PATHS` (only auth endpoints are) → proceed                                    |
| 6   | `(lib)`           | `refreshTokens()`                                                       | dedupe: keyed by refresh-token value; checks `isCookieWritable()` → **writable** here                        |
| 7   | `(lib)`           | `callRefreshEndpoint(refreshToken)`                                     | **native** `fetch` to `POST {API_URL}/api/v1/auth/refresh-token` with `Cookie: refreshToken=${refreshToken}` |
| 8   | `(backend)`       | `refreshToken` handler                                                  | verifies + rotates (Redis blacklist check) → `Set-Cookie` pair 🔑                                            |
| 9   | `(lib)`           | `applySetCookies(setCookies, cookies)`                                  | applies new pair — **writable**, so `ok === true`                                                            |
| 10  | `(lib)`           | `ok && applied` → `retry()`                                             | re-runs the original `$fetch.get('/users/me')` from scratch with the **new** `Cookie` header                 |
| 11  | `(backend)`       | `GET /api/v1/users/me` (retry)                                          | valid token → **200** + user data                                                                            |
| 12  | `(server action)` | `me()` returns `TUserResponse`; action may `revalidateTag` on mutations |                                                                                                              |

**If refresh fails:** `retry()` is skipped, and the original `FetchError` propagates out of the
action → `handleFetchError(error)` (`src/lib/error.ts`) rethrows 401s, so the caller decides
(Server Components should `.catch(() => null)` for a fallback UI — see
`profile/page.tsx`).

**Concurrent 401s:** because `refreshTokens()` is keyed by refresh-token value, N parallel actions
that all 401 share **one** refresh request.

---

## Flow 5 — Logout

**Trigger:** user clicks sign-out (in `logout-button.tsx` or sidebar `nav-user.tsx`).

| #   | Context           | Function call                              | What happens                                                                               |
| --- | ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | `(client)`        | `logout-button.tsx` → `await logoutUser()` | client component invoking the Server Action                                                |
| 2   | `(server action)` | `logoutUser()` — `src/app/actions/auth.ts` |                                                                                            |
| 3   | `(server action)` | `$fetch.post<IResponse>('/auth/logout')`   | `onRequest` forwards cookies                                                               |
| 4   | `(backend)`       | `POST /api/v1/auth/logout`                 | blacklists the refresh token (Redis) and replies with **clearing** `Set-Cookie`s (expired) |
| 5   | `(lib)`           | `onResponse` → `applySetCookies()` 🔑      | relays the clearing cookies → browser deletes both tokens                                  |
| 6   | `(server action)` | `logoutUser` returns `IResponse`           |                                                                                            |
| 7   | `(client)`        | success → `router.push('/login')`          | user lands back on the login page                                                          |

**Cookies after this flow:** both tokens cleared; next protected visit goes through Flow 3's
failure branch → `/login`.

---

## Flow 6 — Unauthenticated visit to a protected page

**Trigger:** browser with **no cookies** requests `GET /dashboard`.

| #   | Context        | Function call                                               | What happens                                           |
| --- | -------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `(proxy)`      | `src/proxy.ts` runs                                         |                                                        |
| 2   | `(proxy)`      | `getTokenExpiry` → no access token / `isAccessTokenExpired` | expired/missing                                        |
| 3   | `(proxy)`      | refresh check: no `refreshToken` cookie either              | cannot refresh                                         |
| 4   | `(proxy)`      | route guard → **not authenticated**                         | `302` redirect to `/login?redirect=/dashboard`         |
| 5   | `(RSC render)` | `/login` page renders `LoginForm`                           | user logs in (Flow 1), which redirects to `/dashboard` |

---

## Quick reference — who refreshes where

| Scenario                        | Refreshing mechanism                         | Context           | Cookie persistence             |
| ------------------------------- | -------------------------------------------- | ----------------- | ------------------------------ |
| Page load, expired access token | `src/proxy.ts` → `tryRefreshTokens`          | `(proxy)`         | via `Set-Cookie` on the 302    |
| Server Action 401               | `$fetch.onError` → `refreshTokens` → `retry` | `(server action)` | via `applySetCookies`          |
| Route Handler 401               | `$fetch.onError` → `refreshTokens` → `retry` | `(route handler)` | via `applySetCookies`          |
| Browser-driven refresh          | `/api/auth/refresh` (same-origin)            | `(route handler)` | relays `Set-Cookie` to browser |
| Auth endpoints (login etc.) 401 | **never** (in `NO_REFRESH_PATHS`)            | —                 | —                              |

## Key functions in the chain

| Function                                             | Location                  | Role                                             |
| ---------------------------------------------------- | ------------------------- | ------------------------------------------------ |
| `getTokenExpiry` / `isAccessTokenExpired`            | `src/proxy.ts`            | local JWT expiry check (no secret needed)        |
| `tryRefreshTokens`                                   | `src/proxy.ts`            | page-load refresh + `Set-Cookie` relay           |
| `refreshTokens`                                      | `src/lib/auth-refresh.ts` | deduped, writable-context-guarded refresh        |
| `callRefreshEndpoint`                                | `src/lib/auth-refresh.ts` | sends only `Cookie: refreshToken=…`              |
| `applySetCookies`                                    | `src/lib/auth-refresh.ts` | `Set-Cookie` parse + apply; `false` if read-only |
| `isCookieWritable`                                   | `src/lib/auth-refresh.ts` | probe for cookie write-ability                   |
| `retry`                                              | `src/lib/fetch/`          | re-runs the request pipeline once                |
| `handleFetchError`                                   | `src/lib/error.ts`        | rethrows 401s, returns `error.data` otherwise    |
| `loginUser` / `logoutUser` / `refreshToken` / `me` … | `src/app/actions/*`       | public action surface used by components         |

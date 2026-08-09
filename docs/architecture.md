# Architecture Review

> Scope: `nextjs-starter-template` — the frontend application. The backend it talks to
> (`express-postgrsql-starter`) is a sibling service and is covered here only at the API
> contract level.
>
> Last updated: 2026-08-03

## 1. Overview

A modern **Next.js 16 App Router** starter with **React 19**, **TypeScript**, **Tailwind CSS v4**,
and **shadcn/ui**, wired to an Express + PostgreSQL backend over a custom **HttpOnly-cookie JWT
auth** flow (no Auth.js / Clerk). Server-rendered pages and Server Actions are the primary data
access paths; all backend calls flow through a single shared fetch layer that handles cookie
forwarding, `Set-Cookie` relay, and automatic token refresh.

```
┌──────────────┐
│   Browser    │   React 19 SPA on top of RSC payloads
└──────┬───────┘
       │  Request + HttpOnly cookies (accessToken, refreshToken)
       ▼
┌─────────────────────────────── Next.js 16 ───────────────────────────────┐
│  src/proxy.ts  (Proxy / middleware)                                       │
│    · route guard (public / protected / auth-only)                         │
│    · silent token refresh on protected page loads                         │
└──────┬────────────────────────────────────────────────────────────────────┘
       ▼
┌─────────────────────────────── App Router ───────────────────────────────┐
│  route groups:  (public)/  (auth)/  (dashboard)/                          │
│  · Server Components (RSC render)  · Server Actions  · Route Handlers     │
└──────┬────────────────────────────────────────────────────────────────────┘
       │  $fetch
       ▼
┌─────────────────────────── src/lib/fetch layer ───────────────────────────┐
│  $fetch (src/lib/$fetch.ts)      ← preconfigured createFetch() instance   │
│    onRequest   → forward Cookie header from request store                 │
│    onResponse  → applySetCookies()  (relay backend Set-Cookie to browser) │
│    onError     → refreshTokens() + retry()  (401 auto-refresh)            │
│  auth-refresh.ts (refreshTokens, applySetCookies, callRefreshEndpoint)    │
│  fetch/ (baseFetch, createFetch, useFetch, FetchError, types)             │
└──────┬────────────────────────────────────────────────────────────────────┘
       │  HTTP  (server-to-server, no CORS)
       ▼
┌─────────────────────────────── Backend API ───────────────────────────────┐
│  express-postgrsql-starter  ·  {NEXT_PUBLIC_API_URL}/api/v1/*              │
│  /auth/login · /auth/refresh-token · /users/*  ...                        │
│  Authenticates via  Cookie: accessToken=...  →  Set-Cookie responses      │
└────────────────────────────────────────────────────────────────────────────┘
```

## 2. Tech Stack

| Layer           | Technology                    | Notes                                                  |
| --------------- | ----------------------------- | ------------------------------------------------------ |
| Framework       | Next.js 16.2.9 (App Router)   | Turbopack dev, React Compiler enabled                  |
| UI              | React 19.2.4 + React DOM      |                                                        |
| Language        | TypeScript 5 (strict)         | path alias `@/*` → `src/*`                             |
| Styling         | Tailwind CSS v4 + PostCSS     | `@import "tailwindcss"` in globals.css                 |
| UI components   | shadcn/ui (`radix-nova`)      | `src/components/ui/` + lucide-react icons              |
| Forms           | react-hook-form + `zod/v3`    | `FormController` wrapper, schemas in `src/validation/` |
| Data fetching   | Custom `$fetch` + `useFetch`  | `src/lib/fetch/`                                       |
| Auth            | HttpOnly JWT cookies          | custom, see [auth.md](./auth.md)                       |
| Package manager | pnpm                          | all scripts via pnpm                                   |
| Quality         | ESLint 9, Prettier 3, Husky   | pre-commit: lint-staged (`lint:fix` + `format`)        |
| Backend         | Express + Prisma + PostgreSQL | sibling repo `express-postgrsql-starter`               |

## 3. Project Structure

```
src/
├── app/                       # App Router
│   ├── (public)/              #   public pages (/, shared layout)
│   ├── (auth)/                #   /login /signup /forgot-password /reset-password /verify-email
│   ├── (dashboard)/           #   /dashboard /profile /profile/edit /users /settings /change-password
│   ├── actions/               #   Server Actions (auth.ts, user.ts)
│   ├── api/                   #   Route Handlers (same-origin auth helpers)
│   │   ├── auth/refresh/      #     POST /api/auth/refresh  → backend refresh + Set-Cookie relay
│   │   ├── cookies/           #     POST /api/cookies       → generic Set-Cookie relay
│   │   └── retry/             #     POST /api/retry         → refresh-and-retry proxy
│   ├── layout.tsx             #   root layout
│   ├── proxy.ts               #   ⚠️ in src/, NOT app/ (see §6)
├── components/
│   ├── modules/               #   feature components (auth/, user/, sidebar/, home/)
│   ├── shared/                #   Header, FormController, ...
│   └── ui/                    #   shadcn/ui primitives (Button, Card, Field, ...)
├── constant/tags.ts           #   cache tags (CACHE_TAGS.PROFILE)
├── lib/
│   ├── $fetch.ts              #   preconfigured fetch client (auth-aware)
│   ├── auth-refresh.ts        #   refresh helpers (refreshTokens, applySetCookies, ...)
│   ├── fetch/                 #   generic fetch layer (createFetch, useFetch, FetchError)
│   ├── session.ts             #   JWT session helpers (used by Header)
│   ├── session2.ts            #   ⚠️ alternative session module (currently unused)
│   ├── error.ts               #   handleFetchError / isFetchError
│   └── utils.ts               #   cn(), date, pick, ...
├── types/                     #   shared types (auth, user, response)
├── validation/                #   Zod schemas (shared by forms + actions)
└── instrumentation-client.ts  #   dev-only: strips browser-extension attributes pre-hydration
```

## 4. Request Lifecycles

### 4.1 Page load (GET / RSC)

1. Browser navigates to a route.
2. `src/proxy.ts` runs first (middleware). It guards protected routes and — critically —
   **refreshes an expired `accessToken` before rendering** (Server Component renders are
   read-only for cookies, so refresh cannot happen in-render). See
   [auth-flow.md §3](./auth-flow.md#3-protected-page-load--expired-access-token--proxy-refresh).
3. Route group renders the page; Server Components may call Server Actions (e.g. `me()`) or
   `$fetch` directly.
4. `$fetch.onRequest` forwards the request's `Cookie` header to the backend; backend responds;
   `$fetch.onResponse` relays any backend `Set-Cookie` back to the browser.

### 4.2 Server Action (POST mutation)

1. Client component invokes a `'use server'` action (via `useFetch` or `useTransition`).
2. The action runs server-side in a **writable cookie context**.
3. It validates input (Zod), calls `$fetch.post/get/...`, and `revalidateTag` on success.
4. On a `401`, `$fetch.onError` refreshes tokens and retries once (see
   [auth-flow.md §4](./auth-flow.md#4-server-action-401--in-app-refresh--retry)).

### 4.3 Route Handler (browser-initiated)

`/api/auth/refresh`, `/api/cookies`, `/api/retry` are always in a mutable cookie phase, so they
are the one place a refresh can **always** persist its cookies — used as same-origin helpers when
a refresh must be triggered by the browser or by server-to-server callers.

## 5. Data Layer

### 5.1 Generic fetch layer — `src/lib/fetch/`

| File                                                         | Responsibility                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `fetch.ts`                                                   | `baseFetch`: URL build, serialization, hooks, retry budget |
| `create-fetch.ts`                                            | `createFetch(defaults)` → preconfigured instance           |
| `merge-config.ts`                                            | instance + per-call config merge rules                     |
| `method-shorthands.ts`                                       | `.get/.post/.put/.patch/.delete/.head`                     |
| `fetch-error.ts`                                             | `FetchError` (carries parsed response, status, url)        |
| `serialize-body.ts` / `serialize-params.ts` / `build-url.ts` | request shaping                                            |
| `types.ts`                                                   | `FetchConfig`, hooks, `RetryFn`, ...                       |
| `use-fetch.ts`                                               | client `useFetch` hook (loading/error/success state)       |
| `index.ts`                                                   | public barrel                                              |

Key design points:

- `FetchConfig extends Omit<RequestInit, 'body'>` → every native fetch option works.
- Generic order is always `TResponse, TBody, TParams`.
- **`onError(error, retry)`**: the second arg `retry()` re-runs the whole pipeline (fresh
  `onRequest` headers) once, gated by an internal symbol-keyed retry budget (default 1).
- `onError` composes differently from the other hooks: a call-level `onError` fully replaces the
  instance-level one.

### 5.2 Auth-aware instance — `src/lib/$fetch.ts`

`createFetch()` instance wired to `{NEXT_PUBLIC_API_URL}/api/v1` with:

- `onRequest` → forwards `Cookie` header from `cookies()`.
- `onResponse` → `applySetCookies()` relays backend `Set-Cookie`.
- `onError` → on `401` (excluding `NO_REFRESH_PATHS`) calls `refreshTokens()` and `retry()`
  only when the new cookies actually landed (`ok && applied`).
- `NO_REFRESH_PATHS`: `/auth/login`, `/auth/register`, `/auth/forgot-password`,
  `/auth/reset-password`, `/auth/verify-email`, `/auth/refresh-token`.

### 5.3 Refresh helpers — `src/lib/auth-refresh.ts`

| Function              | Purpose                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| `callRefreshEndpoint` | raw native fetch to backend `/auth/refresh-token`, sends only `refreshToken` cookie |
| `applySetCookies`     | parses + applies `Set-Cookie` headers; returns `false` in read-only contexts        |
| `isCookieWritable`    | probe-writes a throwaway cookie to detect read-only contexts                        |
| `refreshTokens`       | deduped, keyed by refresh token; **skips entirely when not writable**               |
| `parseCookieHeader`   | `Cookie` header → map                                                               |

### 5.4 Caching

Server Actions call `revalidateTag(CACHE_TAGS.PROFILE)` (`src/constant/tags.ts`) after auth
mutations. No route-level ISR/static caching is configured beyond Next defaults.

## 6. Routing & Auth Guard — `src/proxy.ts`

`proxy.ts` lives in `src/` (same level as `app/`), per the Next.js 16 Proxy convention.

- **Matcher**: everything except `/api/*`, `_next/*`, and static assets.
- **Public routes**: `/login /signup /forgot-password /reset-password /verify-email`.
- **Protected routes**: `/dashboard /profile /settings /users /change-password` (prefix match).
- **Rules**:
  1. `?tokenRefreshed=true` present → strip the tag, redirect to the clean URL (follow-up after a
     proxy-initiated refresh).
  2. Protected + access token missing/expired (`exp` decoded locally) + GET + refresh token
     present → call backend refresh, attach new `Set-Cookie`s to a 302 tagged
     `tokenRefreshed=true`. Successfully refreshed → the browser stores the new tokens and the
     follow-up request renders.
  3. Refresh failed / no tokens → redirect to `/login?redirect=<pathname>`.
  4. Authenticated user hitting an auth-only page → redirect to `/dashboard`.
- **Non-GET requests are left untouched** — Server Actions/Route Handlers handle refresh
  themselves in their writable context (avoids hijacking in-flight actions with a redirect).

## 7. Auth Architecture (summary)

Full detail in [auth.md](./auth.md) and the step-by-step traces in
[auth-flow.md](./auth-flow.md).

| Concern               | Mechanism                                                              |
| --------------------- | ---------------------------------------------------------------------- |
| Token storage         | HttpOnly cookies `accessToken` + `refreshToken` (never `localStorage`) |
| Backend auth          | `Cookie: accessToken=...` header (not `Authorization: Bearer`)         |
| Page-load refresh     | `src/proxy.ts` middleware (read-only renders cannot refresh)           |
| Server Action refresh | `$fetch.onError` → `refreshTokens()` → `retry()`                       |
| Same-origin endpoints | `/api/auth/refresh`, `/api/cookies`, `/api/retry`                      |
| Cookie relay          | `applySetCookies()` in `onResponse` (best-effort, never throws)        |

## 8. Known Notes & Caveats

- **Dashboard layout mock user**: `src/app/(dashboard)/layout.tsx` currently renders a hardcoded
  `IUser` and has the `me()` call commented out. The sidebar shows placeholder data until that is
  wired back up.
- **`session.ts` vs `session2.ts`**: `session.ts` (JWT verify against `ACCESS_TOKEN_SECRET`,
  `getIsLoggedIn`) is used by `src/components/shared/Header.tsx`. `session2.ts` (a second,
  separate session-cookie implementation) is **not imported anywhere** — likely dead code.
- **`handleFetchError`** (`src/lib/error.ts`) returns `error.data` for non-401 failures and
  **rethrows 401s** so the `$fetch.onError` refresh path can handle them. Callers that want a
  fallback UI must `.catch()` themselves (see `profile/page.tsx`).
- **Proxy refresh runs on the public route check too**: an authenticated user with a still-valid
  access token visiting `/login` is redirected to `/dashboard`; an _expired_ token is not (the
  expired case is left to the protected-page path).
- **`instrumentation-client.ts`** strips browser-extension-injected attributes (`bis_*`,
  `data-lt-*`, ...) before React hydration to avoid false hydration-mismatch errors in dev.
- **Rewrite `/server/:path*`** exists in `next.config.ts`, but `$fetch` targets
  `NEXT_PUBLIC_API_URL` directly rather than using it; the rewrite is available for browser-facing
  calls if needed.
- **Refresh is skipped in read-only contexts** by design: rotating the server-side refresh token
  without being able to persist the new cookies would log the user out. This is why the Proxy
  exists for page loads.

## 9. Strengths & Suggested Improvements

### Strengths

- Single, well-typed data-fetching path; auth concerns are centralized (`$fetch` +
  `auth-refresh.ts` + `proxy.ts`), not scattered across components.
- Two-layer refresh correctly handles the read-only vs writable cookie split — a subtle and
  commonly-misunderstood Next.js constraint.
- `onError(error, retry)` with a retry budget is a clean primitive for refresh-and-retry.
- HttpOnly cookies keep tokens out of client JS; no third-party auth dependency.

### Suggested improvements

1. **Re-enable real profile data** in the dashboard layout (remove the mock user).
2. **Delete or consolidate `session2.ts`** to avoid confusion with `session.ts`.
3. **Unify `session.ts` with the auth flow**: `getIsLoggedIn` currently verifies the access token
   with `ACCESS_TOKEN_SECRET`; consider aligning it with the Proxy's exp-decode approach so both
   share one helper.
4. **Add a test runner**: there is currently no test infrastructure (per `AGENTS.md`); the auth
   flow (Proxy refresh, `onError` retry, `applySetCookies`) is the highest-value target for unit +
   integration tests.
5. **Instrument the refresh path** with light logging (`tokenRefreshed` hops, refresh failures) in
   dev to ease debugging.
6. **Rate-limit / backoff on the proxy refresh fetch** (e.g. skip refresh for a short window after
   a failure) to avoid hammering the backend if the refresh token is genuinely invalid.

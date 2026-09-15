# Architecture

This document explains how the pieces of this codebase fit together — the
parts that require reading several files to understand. For commands,
conventions, and quick facts, see [AGENTS.md](AGENTS.md); for what the
product is and who it's for, see [PRODUCT.md](PRODUCT.md).

## System shape

This is a **frontend-only Next.js app**. There are no `src/app/api/` routes
and no database access from this codebase — all data lives behind a separate
backend REST API, reached in one of two equivalent ways:

- Directly, via `API_BASE_URL` from [`src/env.ts`](src/env.ts) — `API_URL` (server-only) or `NEXT_PUBLIC_API_URL`, plus `/api/v1`.
- Through the `/server/:path*` rewrite in `next.config.ts`, which proxies to
  the same backend — useful for same-origin requests from the browser.

Every request to the backend, from both Server and Client Components, goes
through the single `$fetch` instance in [`src/lib/$fetch.ts`](src/lib/$fetch.ts)
(built on `createFetch()` from `src/lib/fetch/`). Nothing should call the
backend with raw `fetch`, and nothing should call the backend from a Next.js
API route — there aren't any.

## Auth: cookies, the proxy guard, and silent refresh

Auth state lives in two `HttpOnly` cookies set by the backend: `accessToken`
and `refreshToken`. Next.js never reads or writes these directly except to
forward them.

1. **Route guard — [`src/proxy.ts`](src/proxy.ts).** Runs on every request
   (matcher excludes `api`, `_next`, static assets) on the Node.js runtime. It
   verifies the access token's signature and gates routes by role against
   `src/lib/auth/route-policy.ts`. Logged-out users go to
   `/login?next=<destination>`; logged-in users are redirected away from
   `(auth)` routes to `/dashboard`; a role that lacks the route's permission is
   rewritten to `/403`. This is an optimistic pre-filter — see
   [Authorization](#authorization-rbac) for why the real check lives in the DAL.

2. **Cookie forwarding — `$fetch`'s `onRequest`/`onResponse` hooks.** Server
   Actions and Server Components run on the Node server, not the browser, so
   `$fetch` manually copies the incoming request's **auth** cookies onto every
   outgoing backend call (`onRequest`), and copies the backend's **auth**
   `Set-Cookie` headers back onto the response (`onResponse`, via
   `set-cookie-parser`, with `Domain` dropped). The allowlist and the
   Set-Cookie → Next cookie conversion live in
   [`src/lib/auth/cookies.ts`](src/lib/auth/cookies.ts), shared with the proxy.
   This is what makes login/logout/refresh work transparently through Server
   Actions.

3. **Silent refresh — the proxy first, `$fetch` as fallback.** Both go through
   `refreshSession()` in [`src/lib/auth/refresh.ts`](src/lib/auth/refresh.ts),
   which POSTs `/auth/refresh-token` with native `fetch` and deduplicates
   concurrent calls **per refresh token** (never across users).
   - **Proxy (primary).** The backend gives the `accessToken` cookie the same
     lifetime as the JWT, so an expired token usually arrives as _no_ token.
     When the access token is missing, invalid, expired, or within 30s of
     expiry and a `refreshToken` is present, the proxy refreshes before the
     page renders, writes the new cookies onto the forwarded request (so this
     render's `cookies()` sees them) and onto the response (so the browser
     keeps them). This has to happen here: Server Components cannot set
     cookies, so a refresh started mid-render never reaches the browser. A
     rejected refresh clears both cookies; an unreachable backend leaves them
     alone and lets the request through for the DAL to decide.
   - **`$fetch` `onError` (fallback).** On a 401 from a non-`/auth/*` endpoint
     it refreshes, sets the cookies where writable (Server Actions, Route
     Handlers), and **retries the request once** with the new `Cookie` header
     via the hook's `context.retry()`. A failed refresh rethrows the 401.
     The `onError` hooks compose, so a call-level `onError` cannot silently
     disable this.
   - **Rotation caveat.** The fallback is safe during a Server Component
     render only because the backend does not revoke the old refresh token
     today. Before enabling rotation, add a short reuse grace window on the
     backend — see the note in `src/lib/auth/refresh.ts`.
     **Do not duplicate this logic** — anything that needs auto-refresh should
     go through `$fetch`.

4. **Reading the session server-side — [`src/lib/auth/dal.ts`](src/lib/auth/dal.ts).**
   One memoized `/users/me` read through `$fetch`, classified as signed-in,
   signed-out (401/403 only), or unavailable (timeout, outage, 5xx). It is the
   one server-side source of session truth, with two views:
   `getCurrentUser()` is best effort (`null` unless signed in) for display —
   the root layout and header — so an API outage doesn't break public pages;
   `verifySession()` (and every guard built on it) redirects to `/login` only
   when signed out and **rethrows** when unavailable. Redirecting on an outage
   would loop: the proxy still sees a valid token and sends `/login` back. JWT decoding is confined to
   [`src/lib/auth/token.ts`](src/lib/auth/token.ts), used only by the proxy's
   optimistic check.

   > `src/lib/session.ts` and `src/lib/session2.ts` are **kept deliberately as
   > reference implementations and are imported by nothing**. `session.ts` is
   > an earlier cookie-decoding session reader; `session2.ts` sketches a
   > separate signed `session` cookie derived from the access token. Read them
   > for ideas, but do not wire them into new code — they bypass the DAL, and
   > `session2.ts` sets `sameSite: 'none'`, which contradicts the cookie model
   > described above. `getCurrentUser()` is the supported entry point.

Token handling must stay in `HttpOnly` cookies end-to-end — never move it to
`localStorage` or client-readable storage.

## Authorization (RBAC)

Roles are `SUPER_ADMIN | ADMIN | USER` (`IUser.role`, also a claim on the access
token). Authorization is expressed once, as a permission catalog, and enforced
at four layers — the first three of which are real, the fourth cosmetic.

**The catalog.** `src/constant/permissions.ts` defines `PERMISSIONS` (a closed
`TPermission` union like `users:update:role`) and `ROLE_PERMISSIONS`, the
explicit role → permissions table. There is no `'*'` wildcard: SUPER_ADMIN's
grants are enumerated so the table can be read and audited. Adding a capability
means adding it here first, which makes a typo anywhere a compile error.

**The rules.** `src/lib/auth/permissions.ts` is pure and isomorphic — no
cookies, no network — so the server guards, the proxy, and the client `<Can>`
component all run the _same_ functions and cannot drift:

- `can(actor, permission)` — does the role hold it at all?
- `canActOnUser(actor, target, permission)` / `explainDenial(...)` — may they
  exercise it against _this record_? This is the IDOR guard: destructive and
  privilege-changing actions never apply to oneself; an actor may only act on
  someone strictly junior (SUPER_ADMIN excepted); read-only permissions skip
  the seniority rule, since listing a record already exposes it.
- `assignableRoles(actor, permission)` — which roles they may grant, so an
  ADMIN cannot mint or promote a peer.

**The layers.**

1. **Proxy — optimistic** (`src/proxy.ts`). Verifies the access-token signature
   with `src/lib/auth/token.ts` (Node.js runtime, so `jsonwebtoken` works —
   no Edge-compatible verifier needed) and checks the role against
   `src/lib/auth/route-policy.ts`. A denial is a **rewrite** to `/403`, not a
   redirect, so the URL is preserved and `src/app/403/page.tsx` raises the same
   `forbidden()` interrupt a page guard would. Signed-out users get
   `/login?next=<destination>`, which the login page reads back.
   A missing or expired access token alongside a refresh token is refreshed
   in the proxy before any check runs (see
   [silent refresh](#auth-cookies-the-proxy-guard-and-silent-refresh)), so role
   gating always runs on freshly verified claims. Only if the backend is
   unreachable does the request pass through unfiltered for the DAL to decide.
   It never authorizes on unverified claims.
2. **Data Access Layer — authoritative** (`src/lib/auth/dal.ts`, `server-only`).
   `verifySession()`, `requirePermission()`, `requireCanActOnUser()`. The role
   comes from `/users/me` through `$fetch` — not from decoding the token —
   so it survives a token rotation and honours the `PROFILE` cache tag. React
   `cache()` collapses it to one backend call per render pass. Guards live in
   _pages_, not in `(dashboard)/layout.tsx`: layouts do not re-run on
   client-side navigation, so they are not a boundary.
3. **Server Actions — mandatory** (`src/app/actions/user.ts`). Every action
   opens with a guard. Actions are independent POST entry points reachable
   without the UI, so a page-level check does not cover them. This is verified:
   a direct POST of the `deleteUserHard` action from an authenticated ADMIN
   session returns 403 before reaching the backend.
4. **UI — cosmetic.** `useAuth()` exposes `can` / `canActOn` / `explainDenial` /
   `assignableRoles`; `<Can>` (`src/components/shared/can.tsx`) gates subtrees;
   the sidebar filters nav items by the same permission the route policy uses.
   In the users table, an action the viewer's role can never perform is
   _hidden_, while one blocked only by the target row is _disabled with a
   reason_ — a silently dead control reads as a bug.

The backend remains the final authority throughout; this layer makes the UI and
the server agree with it rather than replacing it.

## Server Actions and cache invalidation

Mutations live in `src/app/actions/` (`auth.ts`, `user.ts`) as `'use server'`
functions. The shape is consistent across every action:

```ts
const doThing = async (
  id: string,
  data: TInput
): Promise<TOutput | IErrorResponse> => {
  await requireCanActOnUser(id, PERMISSIONS.SOMETHING) // guard first, outside the try
  try {
    const { data: response } = await $fetch.post<TOutput, TInput>(
      userEndpoint(id, '/thing'), // validated + encoded path
      { body: data }
    )
    updateTag(CACHE_TAGS.SOMETHING)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}
```

- **Expected failures are values, not exceptions.** Next.js hides a thrown
  error's message in production, so a thrown "Invalid credentials" would
  reach the form as a generic error. `handleFetchError` (`src/lib/error.ts`)
  turns every `FetchError` into an `IErrorResponse`:
  - HTTP errors → the backend's envelope, copied field by field (no debug
    fields leak), or a synthesized one when the body isn't an envelope (an
    HTML 502 page);
  - `timeout` → 504 `UPSTREAM_TIMEOUT`, `network` → 503
    `SERVICE_UNAVAILABLE`, `parse` → 502 `BAD_UPSTREAM_RESPONSE`.

  It still throws for Next.js interrupts and non-fetch bugs, and calls
  `unauthorized()` for a 401 from a protected endpoint (the refresh fallback
  already failed). A 401 from `/auth/*` — wrong password, bad code — is
  returned like any other error.

- `success` is a literal (`true` on `IResponse`, `false` on
  `IErrorResponse`), so `if (result.success)` narrows the union in forms.
- Cache tags come from `src/constant/tags.ts` (`CACHE_TAGS`). Actions call
  `updateTag` (read-your-own-writes; `revalidateTag` would serve stale content
  once). Note that in Next.js 16 `fetch` isn't cached by default, so the tags
  on `$fetch` reads don't create cache entries today; the `updateTag` call
  still makes the action's response carry a fresh render of the current
  route.

## Component layering

Three tiers, in order of how "product-specific" they are:

- **`src/components/ui/`** — shadcn/ui primitives (`radix-nova` style),
  installed via the shadcn CLI. Treat these as vendor code: extend by
  composition, don't hand-edit business logic into them, and don't
  reimplement what already exists here (button, dialog, table, sidebar,
  etc.).
- **`src/components/shared/`** — cross-feature composed components with no
  single feature owner: `FormController` (the `react-hook-form` field
  wrapper every form uses), `Header`, `Footer`, and the shared data-table
  primitives in `shared/table/`.
- **`src/components/modules/<feature>/`** — feature-owned UI, one directory
  per domain (`auth/`, `user/`, `sidebar/`, `home/`). This is where forms,
  feature-specific views, and domain widgets live (e.g.
  `modules/auth/login-form.tsx`, `modules/user/profile-avatar-uploader.tsx`).

A fourth, route-scoped tier sits under `src/app/**/_components/` and
`_lib/` (e.g. `src/app/(dashboard)/users/_components/`,
`src/app/(dashboard)/users/_lib/`) — the leading underscore excludes them
from Next.js routing. Use this tier for UI and helpers that only make sense
on one page and shouldn't be promoted to `modules/` until (if ever) a second
page needs them.

## Forms and validation

Every form follows the same stack: a Zod schema in `src/validation/`,
`react-hook-form` with `zodResolver`, and `FormController`
(`src/components/shared/FormController.tsx`) to wire fields to the resolver
without repeating label/error/description boilerplate per field. The same
schema is imported by the Server Action for server-side validation, so
client and server never validate a payload differently.

## Data fetching

- **Server-first by default.** Pages are Server Components that call
  `$fetch` (directly or via a guarded read like `getAllUsers`). This is the
  default path for anything that can be resolved at render time — including
  filters and pagination, which live in the URL and re-render on the server
  (see the Users feature).
- **Mutations from the client** go through a Server Action called inside
  `useTransition` (or `useActionState`), branching on `result.success`. There
  is no custom client fetch hook: Server Actions are POST-only and run one at
  a time, so they are the wrong tool for client-side reads. If a feature
  genuinely needs client-side reads with caching, adopt TanStack Query rather
  than growing a hand-rolled hook.
- **Every backend call is bounded**: 10s per attempt, one retry for
  idempotent methods on network errors, timeouts, 408/429/502/503/504
  (`src/lib/fetch/retry.ts`). Refresh calls from the proxy time out after 5s.

## Worked example: the Users feature

`src/app/(dashboard)/users/` is the most complete reference for building a
new CRUD feature and is worth reading end to end before adding another one:

- `page.tsx` — Server Component; parses and validates URL search params
  against `src/validation/user-query.validation.ts`, renders a skeleton
  immediately and the live table once data resolves.
- `_lib/users-query.ts` — column geometry (`USERS_COLUMN_META`) shared
  between the skeleton and the live table so widths never shift between
  states, plus the mapping from validated URL params to API query options.
- `_lib/user-enum.ts`, `_lib/user-display.ts`, `_lib/user-dialog.ts` —
  page-scoped helpers (enum⇄param mapping, display formatting, dialog state).
- `_components/` — the table itself (`users-table.tsx`), toolbar, selection
  bar, per-row action menu, and one dialog per mutation
  (`dialogs/create-user-dialog.tsx`, `edit-user-dialog.tsx`,
  `user-role-dialog.tsx`, `user-status-dialog.tsx`, `user-delete-dialog.tsx`,
  `user-view-dialog.tsx`) — each dialog owns one Server Action call and its
  own form/confirmation state, rather than one large "user editor" component
  branching on mode.

New list-with-filters-and-mutations features should follow this same split:
page-level data + validation, `_lib` for pure helpers, `_components` for UI,
one dialog per mutation.

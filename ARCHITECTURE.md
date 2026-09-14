# Architecture

This document explains how the pieces of this codebase fit together — the
parts that require reading several files to understand. For commands,
conventions, and quick facts, see [AGENTS.md](AGENTS.md); for what the
product is and who it's for, see [PRODUCT.md](PRODUCT.md).

## System shape

This is a **frontend-only Next.js app**. There are no `src/app/api/` routes
and no database access from this codebase — all data lives behind a separate
backend REST API, reached in one of two equivalent ways:

- Directly, via `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:5000/api/v1`).
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
   `$fetch` manually copies the incoming request's cookies onto every
   outgoing backend call (`onRequest`), and copies any `Set-Cookie` headers
   the backend returns back onto the response (`onResponse`, via
   `set-cookie-parser`). This is what makes login/logout/refresh work
   transparently through Server Actions.

3. **Silent refresh on 401 — `$fetch`'s `onError` hook.** When a backend call
   returns 401, `$fetch` calls `/auth/refresh-token` directly (via native
   `fetch`, not `$fetch`, to avoid recursion) using the `refreshToken`
   cookie, forwards the new `Set-Cookie` headers, then rethrows the original
   401 so the caller can retry. Concurrent 401s are deduplicated through a
   single shared `refreshPromise` so simultaneous requests don't trigger
   multiple refresh calls. **Do not duplicate this logic** — anything that
   needs auto-refresh should go through `$fetch`.

4. **Reading the session server-side — [`src/lib/auth/dal.ts`](src/lib/auth/dal.ts).**
   `getCurrentUser()` returns the signed-in `IUser` (or `null`) by calling
   `/users/me` through `$fetch`, memoized with React `cache()`. It is the one
   server-side source of session truth — the root layout, the header, and every
   authorization guard all go through it. JWT decoding is confined to
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
   Crucially, an **expired** access token alongside a refresh token still reads
   as signed in and skips role gating — verifying strictly here would defeat
   `$fetch`'s silent refresh and log people out on every token rotation. It
   never authorizes on unverified claims.
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
const doThing = async (data: TInput): Promise<TOutput | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<TOutput, TInput>('/path', {
      body: data,
    })
    revalidateTag(CACHE_TAGS.SOMETHING, 'max')
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}
```

- `handleFetchError` (`src/lib/error.ts`) normalizes a caught `FetchError`
  into `IErrorResponse` for the caller to render inline — _unless_ it's a 401,
  which it rethrows (401s are handled by the refresh flow above, not by
  per-action error UI).
- Cache tags come from `src/constant/tags.ts` (`CACHE_TAGS`). Actions that
  change a resource revalidate its tag(s) so Server Components re-fetch
  fresh data on next render — this is the only invalidation mechanism; there
  is no client-side cache to sync separately.

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
  `$fetch` (directly or via a Server Action) and read `revalidateTag`d data.
  This is the default path for anything that can be resolved at render time.
- **Client-side when interaction demands it** (filters, live updates, forms
  that need loading/error state in the UI) — use the `useFetch` hook
  (`src/lib/fetch/use-fetch.ts`) instead of hand-rolled `useState`/`useEffect`
  fetch logic.

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

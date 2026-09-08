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

1. **Edge guard — [`src/proxy.ts`](src/proxy.ts).** Runs on every request
   (matcher excludes `api`, `_next`, static assets). It only checks whether
   `accessToken`/`refreshToken` cookies are _present_ — it does not verify or
   decode them. Logged-out users are redirected away from dashboard routes
   (`/dashboard`, `/profile`, `/settings`, `/users`, `/change-password`) to
   `/login`; logged-in users are redirected away from `(auth)` routes to
   `/dashboard`. This is presence-based routing, not authorization — the
   backend is the source of truth for whether a token is actually valid.

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

4. **Reading the session server-side — [`src/lib/session.ts`](src/lib/session.ts).**
   `getSession()` decodes the `accessToken` JWT (via `ACCESS_TOKEN_SECRET`)
   for server-side reads like the header's user display. Note:
   `src/lib/session2.ts` is a second, currently-unused implementation of the
   same idea (a signed session cookie derived from the access token) — it's
   not imported anywhere yet. Treat `session.ts` as the active implementation
   until that work lands or the dead file is removed.

Token handling must stay in `HttpOnly` cookies end-to-end — never move it to
`localStorage` or client-readable storage.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ before introducing new patterns or relying on older Next.js conventions.

<!-- END:nextjs-agent-rules -->

# nextjs-starter-template

## Working conventions

- Use pnpm for every install, run, and script. Avoid npm/yarn unless the user explicitly asks.
- Prefer existing abstractions: shared fetch layer, validation schemas (Zod), shadcn/ui primitives, and FormController.
- Keep changes aligned with the App Router structure and route-group layouts under src/app/.
- If a task touches auth, data fetching, or forms, inspect src/app/actions/, src/lib/, src/validation/, and src/components/modules/ first.

## Environment

- Copy `.env.example` to `.env` and set `NEXT_PUBLIC_API_URL` (default `http://localhost:5000`) and `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000`).
- `$fetch` talks to `${NEXT_PUBLIC_API_URL}/api/v1` directly; the `/server/:path*` rewrite in `next.config.ts` also maps to it.
- `.env` is gitignored — never commit secrets. `.env.example` is the source of truth for required vars.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm start` — dev server and production build
- `pnpm lint` — ESLint (eslint.config.mjs)
- `pnpm lint:fix` — ESLint with auto-fix
- `pnpm format` — Prettier (only `**/*.{ts,tsx}`)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm prepare` — install Husky hooks
- `pnpm lint-staged` — runs on pre-commit; applies `lint:fix` + `format` for JS/TS/TSX, `format` for JSON/MD/YAML

No test runner is installed — do not assume a test command exists.

## Stack and project expectations

- Next.js 16.2.9 App Router, React 19.2.4
- Tailwind CSS v4 via `@tailwindcss/postcss` + `@import "tailwindcss"` in globals.css
- shadcn/ui primitives in `src/components/ui/` (style: `radix-nova`); use them instead of reimplementing
- React Compiler enabled (`reactCompiler: true` in next.config.ts)
- Zod v4 installed, but imports use `zod/v3` for compatible API surface (`import z from 'zod/v3'`)
- shadcn/ui style is `radix-nova` (components.json), icon library is lucide-react

## Architecture notes

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full picture — auth/cookie/refresh flow, component layering (`ui/` vs `shared/` vs `modules/` vs route-scoped `_components`/`_lib`), Server Action + cache-tag conventions, and a worked example (the Users feature). The points below are the quick-reference summary.

- Route groups: `(public)/` home, `(auth)/` login/signup/forgot-password/reset-password/verify-email, `(dashboard)/` dashboard/profile/settings/users/change-password with sidebar. No `src/app/api/` routes exist — all data goes to the backend via `$fetch`.
- Server Actions live in `src/app/actions/` — default place for auth mutations and backend calls from forms.
- Client-side data fetching goes through the shared fetch layer in `src/lib/`.
- `src/proxy.ts` is a real auth guard, not a placeholder: redirects logged-out users from `/dashboard`, `/profile`, `/settings`, `/users` to `/login`, and logged-in users away from `(auth)/` routes to `/dashboard`. Matcher excludes `api`, `_next`, static assets.

## Data layer and API conventions

- API client configured in `src/lib/$fetch.ts` using `createFetch()` from `src/lib/fetch/`.
- Auto-refresh on 401 is built into `$fetch` (via `onError` handler); do not duplicate.
- Rewrite in `next.config.ts` maps `/server/:path*` → `${NEXT_PUBLIC_API_URL}/api/v1/:path*`.
- Cookie propagation and Set-Cookie forwarding handled in `$fetch`; do not reimplement.
- Server Actions use `$fetch.post<T>()` patterns (not raw `fetch`) and call `revalidateTag(CACHE_TAGS.PROFILE, 'max')` with tags from `src/constant/tags.ts`.
- Client async state: prefer `useFetch` hook from `src/lib/fetch/use-fetch.ts` over custom loading/error logic.
- Server Action error handling: `handleFetchError` from `src/lib/error.ts` normalizes failures to `T | IErrorResponse`;

## Forms, validation, and types

- Validation schemas in `src/validation/` are reused by forms and actions.
- Types in `src/types/` (auth, user, response) — keep new types here or near the feature.
- Forms use `react-hook-form` + `zodResolver` (from `@hookform/resolvers`). Follow this pattern.
- Reuse `FormController` from `src/components/shared/FormController.tsx` for form fields.

## Implementation expectations for agents

- Prefer named exports for components, hooks, and utilities instead of default-exporting everything.
- For new features, place pages under the appropriate route-group folder in `src/app/` and keep feature-specific UI in `src/components/modules/`.
- For mutations and server-side auth flows, use Server Actions in `src/app/actions/` and revalidate relevant tags from `src/constant/tags.ts`.
- For client-side data fetching, prefer the shared `useFetch` hook from `src/lib/fetch/use-fetch.ts` over custom loading/error state.
- If a change touches auth, cookies, or token refresh, preserve the existing HttpOnly cookie flow in `src/lib/$fetch.ts`; do not move token handling to `localStorage`.
- Reuse existing validation schemas and shared types instead of introducing ad hoc types or duplicate logic.

## Styling and code style

- Formatting: no semicolons, single quotes, trailing commas (Prettier-driven).
- Path alias `@/*` maps to `src/*`.
- Use `cn()` from `src/lib/utils.ts` for className composition.
- Keep Tailwind classes organized; no ad hoc styling.

## File and function size

Guidelines for new or heavily-edited code, not a retroactive requirement — several existing feature components predate this and are not being mass-refactored to comply:

- Components/modules: soft cap **150 lines** per file. Past that, split by responsibility (e.g. extract a dialog, a sub-list, or a `_lib` helper) rather than growing one file — this repo's convention is already one dialog/view per file (see `users/_components/dialogs/`).
- Functions: soft cap **100 lines**. If a function needs more, it's usually doing more than one job — extract the validation, mapping, or side-effect step into its own named function.
- `src/components/ui/` (shadcn/ui primitives) is vendor code and exempt from both limits — don't split or trim it to hit a target.
- These are advisory (not enforced by `pnpm lint`); if you want them enforced, ESLint's `max-lines` / `max-lines-per-function` rules are the natural fit, but turning them on will immediately flag existing files — treat that as a separate, deliberate decision, not a side effect of a docs change.

## Pre-commit flow

Runs via Husky + lint-staged:

1. `pnpm lint:fix` (ESLint) and `pnpm format` (Prettier) for `*.{js,ts,tsx}`
2. `pnpm format` only for `*.{json,md,yml,yaml}`
   Does **not** run `typecheck` automatically.

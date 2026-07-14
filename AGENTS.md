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

- Route groups: `(public)/` for public pages, `(auth)/` for login/signup, `(dashboard)/` for authenticated pages with sidebar.
- Server Actions live in `src/app/actions/` — default place for auth mutations and backend calls from forms.
- Client-side data fetching goes through the shared fetch layer in `src/lib/`.
- `src/proxy.ts` is a placeholder middleware (matcher: `/api/auth/*`); currently redirects to `/home`.

## Data layer and API conventions

- API client configured in `src/lib/$fetch.ts` using `createFetch()` from `src/lib/fetch/`.
- Auto-refresh on 401 is built into `$fetch` (via `onError` handler); do not duplicate.
- Rewrite in `next.config.ts` maps `/server/:path*` → `${NEXT_PUBLIC_API_URL}/api/v1/:path*`.
- Cookie propagation and Set-Cookie forwarding handled in `$fetch`; do not reimplement.
- Server Actions use `$fetch.post<T>()` patterns (not raw `fetch`) and call `revalidateTag` with cache tags from `src/constant/tags.ts`.
- Client async state: prefer `useFetch` hook from `src/lib/fetch/use-fetch.ts` over custom loading/error logic.

## Forms, validation, and types

- Validation schemas in `src/validation/` are reused by forms and actions.
- Types in `src/types/` (auth, user, response) — keep new types here or near the feature.
- Forms use `react-hook-form` + `zodResolver` (from `@hookform/resolvers`). Follow this pattern.
- Reuse `FormController` from `src/components/shared/FormController.tsx` for form fields.

## Styling and code style

- Formatting: no semicolons, single quotes, trailing commas (Prettier-driven).
- Path alias `@/*` maps to `src/*`.
- Use `cn()` from `src/lib/utils.ts` for className composition.
- Keep Tailwind classes organized; no ad hoc styling.

## Pre-commit flow

Runs via Husky + lint-staged:

1. `pnpm lint:fix` (ESLint) and `pnpm format` (Prettier) for `*.{js,ts,tsx}`
2. `pnpm format` only for `*.{json,md,yml,yaml}`
   Does **not** run `typecheck` automatically.

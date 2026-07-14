<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# nextjs-starter-template

## Commands

- `pnpm dev` / `pnpm build` / `pnpm start` — Next.js dev/build/start
- `pnpm lint` — ESLint (flat config, `eslint.config.mjs`)
- `pnpm lint:fix` — ESLint with `--fix`
- `pnpm format` — Prettier for `**/*.{ts,tsx}`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm prepare` — Husky install (runs post-install)

Pre-commit hook runs `pnpm lint-staged` → lints + formats staged files.
Run order: `lint:fix` → `format` → `typecheck`.

No test framework is installed — no test commands.

## Stack

- **Next.js 16.2.9** (App Router, `reactCompiler: true` in `next.config.ts`)
- **React 19.2.4**
- **Tailwind CSS v4** — use `@import "tailwindcss"`, NOT `@tailwind base/components/utilities`. PostCSS plugin: `@tailwindcss/postcss` (v4).
- **shadcn/ui** — style `radix-nova` (not default). Config in `components.json`.
- **pnpm** — only package manager.
- **Zod v4** — import from `zod/v3` for v3-compat API (`src/validation/`).

## API / Data Layer

- All client-side API calls go through `src/lib/fetch/$fetch.ts`, which points at `{NEXT_PUBLIC_SITE_URL}/server` (Next.js rewrite in `next.config.ts`). The rewrite maps `/server/:path*` → `{NEXT_PUBLIC_API_URL || http://localhost:5000}/api/v1/:path*`.
- `src/lib/fetch/index.ts` exports `createFetch()` and a bare `$fetch` instance. The project uses a configured instance from `src/lib/fetch/$fetch.ts`.
- Auto token refresh on 401 via `onError` interceptor in `$fetch.ts`.
- Server Actions in `src/app/actions/` use `$fetch` + `revalidateTag`.
- `src/lib/fetch/useFetch.ts` — `useFetch` hook for client-side async state management (loading/success/error, manual or automatic execution).

## Code Style

- **No semicolons**, single quotes, trailing commas (es5). Prettier with `prettier-plugin-tailwindcss` for class sorting.
- Path alias: `@/*` → `./src/*`.
- `cn()` utility in `src/lib/utils.ts` (clsx + tailwind-merge).
- VSCode format-on-save + auto-organize imports.

## Project Structure

- `src/app/(public)/` — public routes (home page)
- `src/app/(auth)/` — auth routes (login, signup)
- `src/app/(dashboard)/` — authenticated routes (dashboard, users, settings, profile)
- `src/components/ui/` — shadcn primitives
- `src/components/modules/` — feature-specific components
- `src/lib/fetch/` — custom fetch wrapper + useFetch hook
- `src/app/actions/` — Server Actions (auth, user)
- `src/validation/` — Zod schemas

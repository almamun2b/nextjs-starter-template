<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ before introducing new patterns or relying on older Next.js conventions.

<!-- END:nextjs-agent-rules -->

# nextjs-starter-template

## Working conventions

- Use pnpm for every install, run, and script. Avoid npm/yarn unless the user explicitly asks.
- Prefer the existing abstractions in this repo over adding new ones: use the shared fetch layer, validation schemas, and UI primitives first.
- Keep changes aligned with the App Router structure and the existing route-group layout under src/app/.
- If a task touches auth, data fetching, or forms, inspect the matching modules in src/app/actions/, src/lib/, src/validation/, and src/components/modules/ before implementing.

## Commands

- pnpm dev / pnpm build / pnpm start — local development and production build
- pnpm lint — ESLint via eslint.config.mjs
- pnpm lint:fix — auto-fix lint issues
- pnpm format — format TypeScript/TSX files with Prettier
- pnpm typecheck — run TypeScript type checking with tsc --noEmit
- pnpm prepare — install Husky hooks

The pre-commit flow runs lint-staged checks and then format/typecheck. No dedicated test runner is installed, so do not assume a test command exists.

## Stack and project expectations

- Next.js 16.2.9 with the App Router and React 19.2.4
- Tailwind CSS v4; use the import-based setup from the global stylesheet and keep class names consistent with the existing utility patterns
- shadcn/ui primitives live under src/components/ui/ and should be reused rather than reimplemented
- Zod v4 is used, but the project imports from zod/v3 for the compatible API surface in src/validation/

## Architecture notes

- Public routes live under src/app/(public)/, auth routes under src/app/(auth)/, and authenticated dashboard routes under src/app/(dashboard)/.
- Route-specific UI should stay close to its route; feature components belong in src/components/modules/ and shared cross-cutting UI in src/components/shared/.
- Server Actions belong in src/app/actions/ and should be the default place for auth-related mutations and backend calls from forms.
- Client-side data fetching should normally go through the shared fetch layer in src/lib/ rather than ad hoc fetch calls.

## Data layer and API conventions

- The frontend API client is configured in src/lib/$fetch.ts and the shared fetch helpers under src/lib/fetch/.
- Requests should use the shared $fetch instance or createFetch() helpers instead of calling fetch directly in components.
- The rewrite in next.config.ts maps /server/:path\* to the backend API base, so prefer that path when a client-side call needs to reach the proxy layer.
- Authentication refresh and cookie propagation are already handled in src/lib/$fetch.ts; do not duplicate that logic in new features.
- Server Actions commonly combine $fetch with revalidateTag from next/cache for cache invalidation.
- For client-side async state, prefer the useFetch hook in src/lib/fetch/use-fetch.ts rather than adding custom loading/error state logic.

## Forms, validation, and types

- Validation schemas belong in src/validation/ and should be reused by forms and actions.
- Auth-related request/response shapes live in src/types/; keep new types there or in the nearest feature-specific type module.
- Forms in this project already use react-hook-form plus zodResolver; follow that pattern instead of introducing a new form library.
- Reuse the shared form helpers in src/components/shared/FormController.tsx when adding form fields that follow the existing structure.

## Styling and code style

- Follow the existing formatting conventions: no semicolons, single quotes, trailing commas, and Prettier-driven formatting.
- Use the path alias @/_ for imports to src/_.
- Use the cn() helper from src/lib/utils.ts for className composition.
- Keep Tailwind classes organized and avoid introducing ad hoc styling systems.
- Follow the existing component style: small, composable UI components with props passed through clearly.

## When making changes

- Prefer minimal, localized edits that fit the current structure.
- If a new feature needs API access, add or reuse the appropriate server action and type definitions before wiring up UI.
- If you introduce a new route, place it in the matching route group and keep the layout behavior consistent with the existing auth/dashboard/public boundaries.
- Do not add a test framework unless the user explicitly asks; the repo currently has no test workflow.

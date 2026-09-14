# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers evaluating or adopting this repository as the starting point for a new Next.js application. They clone it to skip re-building auth, forms, and data tables from scratch, and get straight to building their product's actual features on top of it.

## Product Purpose

A production-ready Next.js starter template that gives developers a working foundation instead of a bare scaffold: a complete auth flow (login, signup, forgot-password, reset-password, verify-email) backed by HttpOnly cookies with automatic token refresh, plus a full CRUD user-management reference module (roles, statuses, avatar upload, filtering/sorting/pagination) that demonstrates the template's conventions end to end. Success means a developer can clone the repo, point it at their own backend API, and ship real features on day one without re-deriving auth, validation, or data-table patterns.

## Positioning

Most Next.js starters stop at a themed landing page and a counter demo. This one ships a non-trivial, working reference implementation instead — real RBAC user administration, real cookie-based auth with silent refresh, real form validation via shared Zod schemas — so the patterns it teaches are provably correct rather than illustrative.

## Operating Context

Developers run `pnpm install`, copy `.env.example` to `.env`, and point `NEXT_PUBLIC_API_URL` at a separate backend REST API — this repo has no `src/app/api/` routes; data flows through the shared `$fetch` layer and a `/server/:path*` rewrite. `pnpm dev` starts the app; Husky + lint-staged enforce lint/format on commit. The auth and user-management module is meant to be adapted or stripped down as developers build their own product on top of it — the "preorder management" copy on the home/dashboard pages is placeholder/demo framing for the module, not a real business feature.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui (`radix-nova` style), React Compiler enabled.
- Route groups: `(public)` marketing/home, `(auth)` login/signup/forgot-password/reset-password/verify-email, `(dashboard)` dashboard/profile/settings/users/change-password with sidebar. `src/proxy.ts` is a real auth guard — redirects logged-out users away from dashboard routes and logged-in users away from auth routes.
- Backend is external; all mutations go through Server Actions in `src/app/actions/` calling `$fetch` — never raw `fetch` or Next.js API routes.
- Forms use react-hook-form + zodResolver; validation schemas live in `src/validation/` and are shared between forms and Server Actions.
- No test runner is installed.
- pnpm is the required package manager for install, run, and scripts.

## Brand Commitments

Named "Next.js Starter Template" (MIT licensed; author Md Abdullah Al Mamun). No visual identity, palette, or typography has been confirmed as binding — that is a visual-world decision for later design work, not a product fact.

## Evidence on Hand

No real customer content, testimonials, or business data exists — this is a template/scaffold, not a live product with paying users. The user-management module contains only illustrative demo data (roles: Super Admin/Admin/User; statuses: Pending/Active/Inactive/Suspended/Banned/Deleted). Future work must not fabricate customer-facing proof, pricing, or case studies for this template.

## Product Principles

- Ship working reference implementations, not toy examples — every included module (auth, user admin) must function end to end against a real backend contract.
- Keep the backend boundary hard: no data logic in Next.js API routes; everything flows through the shared `$fetch` layer and Server Actions.
- Favor patterns a developer will actually reuse (shared validation schemas, `FormController`, `useFetch`) over one-off implementations, so adopting the template teaches its conventions by example.
- Preserve the HttpOnly-cookie auth flow and auto-refresh as a hard constraint — never move token handling to `localStorage`.
- Keep the template lean enough to strip down: included features exist to demonstrate patterns, not to lock adopters into this exact domain (users/preorders).

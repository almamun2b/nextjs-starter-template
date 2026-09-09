import { forbidden } from 'next/navigation'

/**
 * The proxy's rewrite target for a role-based denial.
 *
 * It exists only so `src/proxy.ts` — which cannot call `forbidden()` itself —
 * lands on the same interrupt a page-level guard would raise, giving both the
 * same UI (`src/app/forbidden.tsx`) and the same 403 status. The URL the user
 * typed is preserved, because the proxy rewrites rather than redirects.
 */
export default function ForbiddenRoute(): never {
  forbidden()
}

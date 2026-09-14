import { LoginForm } from '@/components/modules/auth/login-form'
import { REDIRECT_PARAM, safeRedirectTarget } from '@/lib/auth/route-policy'
import { Home } from 'lucide-react'
import Link from 'next/link'

type TLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: TLoginPageProps) {
  // Resolved here rather than with `useSearchParams` in the form, which would
  // force a client-side bailout on an otherwise server-rendered page.
  const redirectTo = safeRedirectTarget((await searchParams)[REDIRECT_PARAM])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="mx-auto flex shrink-0 items-center gap-2">
          <Home className="size-8 text-primary" />
          <span className="text-lg font-semibold">My Site</span>
        </Link>
        <LoginForm className="shadow-xl" redirectTo={redirectTo} />
      </div>
    </div>
  )
}

import { VerifyEmailForm } from '@/components/modules/auth/verify-email-form'
import { Home } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type TPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyEmailPage({ searchParams }: TPageProps) {
  const { email } = await searchParams

  if (!email) redirect('/signup')

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="mx-auto flex shrink-0 items-center gap-2">
          <Home className="size-8 text-primary" />
          <span className="text-lg font-semibold">My Site</span>
        </Link>
        <VerifyEmailForm email={email} className="shadow-xl" />
      </div>
    </div>
  )
}

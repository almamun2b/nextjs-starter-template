'use client'

import { resendForgotPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useResendCooldown } from '@/lib/use-resend-cooldown'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'

type TForgotPasswordEmailSendProps = React.ComponentProps<'div'> & {
  email: string
}

export function ForgotPasswordEmailSend({
  email,
  ...props
}: TForgotPasswordEmailSendProps) {
  const [isPending, startTransition] = useTransition()
  const { cooldown, restart } = useResendCooldown()

  const handleResend = () => {
    if (cooldown > 0 || isPending) return

    startTransition(async () => {
      const result = await resendForgotPassword({ email })

      if (result.success) {
        toast.success(result.message)
        restart()
        return
      }

      toast.error(result.message)
    })
  }

  return (
    <Card {...props}>
      <CardHeader>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-6 text-primary" />
        </div>
        <CardTitle className="text-center">Check your email</CardTitle>
        <CardDescription className="text-center">
          The reset link has been sent to your email address. Please check your
          email inbox and click the link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-center text-sm">
          We sent a link to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={cooldown > 0 || isPending}
          >
            {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
          </Button>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline-offset-4 hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

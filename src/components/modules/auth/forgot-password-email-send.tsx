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
import { Mail } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

type TForgotPasswordEmailSendProps = React.ComponentProps<'div'> & {
  email: string
}

export function ForgotPasswordEmailSend({
  email,
  ...props
}: TForgotPasswordEmailSendProps) {
  const [isPending, startTransition] = useTransition()
  const [cooldown, setCooldown] = useState(120)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [])

  const handleResend = () => {
    if (cooldown > 0 || isPending) return

    startTransition(async () => {
      const result = await resendForgotPassword({ email })

      if (result.success) {
        toast.success(result.message)
        clearTimer()
        setCooldown(120)
        intervalRef.current = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearTimer()
              return 0
            }
            return prev - 1
          })
        }, 1000)
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
      </CardContent>
    </Card>
  )
}

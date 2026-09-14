'use client'

import { resendVerificationCode, verifyEmail } from '@/app/actions/auth'
import { FormController } from '@/components/shared/FormController'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup } from '@/components/ui/field'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { isFormInputField } from '@/lib/form'
import { useResendCooldown } from '@/lib/use-resend-cooldown'
import { verifyEmailSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v3'

type TVerifyEmailFormProps = React.ComponentProps<'div'> & {
  email: string
}

type TFormValues = z.infer<typeof verifyEmailSchema>

export function VerifyEmailForm({ email, ...props }: TVerifyEmailFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { cooldown, restart } = useResendCooldown()

  const form = useForm<TFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: '' },
    mode: 'onChange',
  })

  const onSubmit = (data: TFormValues) => {
    startTransition(async () => {
      const result = await verifyEmail({ email, code: data.code })

      if (result.success) {
        toast.success(result.message)
        form.reset()
        router.replace('/login')
        return
      }

      if ('errors' in result && result.errors && result.errors.length) {
        for (const { field, message } of result.errors) {
          if (field && isFormInputField(field, form.getValues())) {
            form.setError(field, { message: message ?? 'Unknown Error' })
          }
        }
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleResend = () => {
    if (cooldown > 0 || isPending) return

    startTransition(async () => {
      try {
        const result = await resendVerificationCode({ email })

        if (result.success) {
          toast.success(result.message)
          restart()
          return
        }
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to resend verification code')
      }
    })
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a 6-digit verification code to{' '}
          <span className="font-medium">{email}</span>. Enter the code below to
          activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormController
              name="code"
              control={form.control}
              orientation="responsive"
              label={
                <>
                  Verification Code <span className="text-destructive">*</span>
                </>
              }
              description="Enter the 6-digit code sent to your email"
            >
              {(field) => (
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}
            </FormController>
            <Field>
              <Button
                type="submit"
                className="h-9"
                disabled={
                  isPending ||
                  form.formState.isLoading ||
                  form.formState.isSubmitting ||
                  !form.formState.isValid
                }
              >
                {isPending ||
                form.formState.isLoading ||
                form.formState.isSubmitting
                  ? 'Verifying...'
                  : 'Verify Email'}
              </Button>
              <div className="flex flex-col items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isPending}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </Button>
                <FieldDescription>
                  <Link
                    href="/login"
                    className="underline-offset-4 hover:underline"
                  >
                    Back to login
                  </Link>
                </FieldDescription>
              </div>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { resetPassword } from '@/app/actions/auth'
import { PasswordInput } from '@/components/modules/auth/password-input'
import { PasswordStrengthMeter } from '@/components/modules/auth/password-strength-meter'
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
import { isFormInputField } from '@/lib/form'
import { TResetPasswordForm } from '@/types/auth.types'
import { resetPasswordSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type TResetPasswordFormProps = React.ComponentProps<'div'> & {
  token: string
}

export function ResetPasswordForm({
  token,
  ...props
}: TResetPasswordFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<TResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const onSubmit = (data: TResetPasswordForm) => {
    startTransition(async () => {
      const result = await resetPassword({
        token: data.token,
        newPassword: data.newPassword,
      })

      if (result.success) {
        toast.success(result.message)
        form.reset()
        router.push('/login')
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

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormController
              name="newPassword"
              control={form.control}
              orientation="responsive"
              label={
                <>
                  New Password <span className="text-destructive">*</span>
                </>
              }
              description="Must be at least 8 characters with uppercase, lowercase, number, and special character"
            >
              {(field, fieldState) => (
                <>
                  <PasswordInput
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={`${field.name}-requirements`}
                    placeholder="********"
                    autoComplete="on"
                    className="h-9 max-w-md"
                  />
                  <PasswordStrengthMeter
                    value={field.value}
                    inputId={field.name}
                    className="max-w-md pt-1"
                  />
                </>
              )}
            </FormController>
            <FormController
              name="confirmPassword"
              control={form.control}
              orientation="responsive"
              label={
                <>
                  Confirm password <span className="text-destructive">*</span>
                </>
              }
            >
              {(field, fieldState) => (
                <PasswordInput
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="********"
                  autoComplete="on"
                  className="h-9 max-w-md"
                />
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
                  ? 'Resetting...'
                  : 'Reset Password'}
              </Button>
              <FieldDescription className="text-center">
                <Link
                  href="/login"
                  className="underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

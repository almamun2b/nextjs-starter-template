'use client'

import { resetPassword } from '@/app/actions/auth'
import { PasswordInput } from '@/components/modules/auth/password-input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { isFormInputField } from '@/lib/form'
import { TResetPasswordForm } from '@/types/auth.types'
import { resetPasswordSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="responsive"
                >
                  <FieldContent className="flex flex-col gap-1">
                    <FieldLabel htmlFor={field.name}>
                      New Password <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      Must be at least 8 characters with uppercase, lowercase,
                      number, and special character
                    </FieldDescription>
                  </FieldContent>
                  <PasswordInput
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="********"
                    autoComplete="on"
                    className="h-9 max-w-md"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="responsive"
                >
                  <FieldContent className="flex flex-col gap-1">
                    <FieldLabel htmlFor={field.name}>
                      Confirm password{' '}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                  </FieldContent>
                  <PasswordInput
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="********"
                    autoComplete="on"
                    className="h-9 max-w-md"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
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
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

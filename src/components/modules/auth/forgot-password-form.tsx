'use client'

import { forgotPassword } from '@/app/actions/auth'
import { ForgotPasswordEmailSend } from '@/components/modules/auth/forgot-password-email-send'
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
import { Input } from '@/components/ui/input'
import { isFormInputField } from '@/lib/form'
import { TForgotPasswordForm } from '@/types/auth.types'
import { forgotPasswordSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

type TForgotPasswordFormProps = React.ComponentProps<'div'>

export function ForgotPasswordForm({ ...props }: TForgotPasswordFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submittedEmail, setSubmittedEmail] = useState('')

  const form = useForm<TForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  })

  const onSubmit = (data: TForgotPasswordForm) => {
    startTransition(async () => {
      const result = await forgotPassword(data)

      if (result.success) {
        toast.success(result.message)
        setSubmittedEmail(data.email)
        form.reset()
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

  if (submittedEmail) {
    return <ForgotPasswordEmailSend email={submittedEmail} {...props} />
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="responsive"
                >
                  <FieldContent className="flex flex-col gap-1">
                    <FieldLabel htmlFor={field.name}>
                      Email <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      Enter your email address
                    </FieldDescription>
                  </FieldContent>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="jon@example.com"
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
                  ? 'Sending...'
                  : 'Send Reset Link'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { changeMyPassword } from '@/app/actions/user'
import { PasswordInput } from '@/components/modules/auth/password-input'
import { PasswordStrengthMeter } from '@/components/modules/auth/password-strength-meter'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { isFormInputField } from '@/lib/form'
import { TChangePasswordForm } from '@/types/user.types'
import { changePasswordSchema } from '@/validation/user.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormController } from '@/components/shared/FormController'

type TChangePasswordFormProps = React.ComponentProps<'div'>

export function ChangePasswordForm({ ...props }: TChangePasswordFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<TChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const onSubmit = (data: TChangePasswordForm) => {
    startTransition(async () => {
      const result = await changeMyPassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      })

      if (result.success) {
        toast.success(result.message)
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

  const isValid =
    form.formState.isValid && form.formState.dirtyFields.oldPassword

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Update your account password. You&apos;ll need to enter your current
          password first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="change-password-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormController
              name="oldPassword"
              control={form.control}
              label="Current password *"
            >
              {(field, fieldState) => (
                <PasswordInput
                  {...field}
                  id="oldPassword"
                  aria-invalid={fieldState.invalid}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="max-w-md"
                />
              )}
            </FormController>

            <FormController
              name="newPassword"
              control={form.control}
              label="New password *"
            >
              {(field, fieldState) => (
                <>
                  <PasswordInput
                    {...field}
                    id="newPassword"
                    aria-invalid={fieldState.invalid}
                    aria-describedby="newPassword-requirements"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="max-w-md"
                  />
                  <PasswordStrengthMeter
                    value={field.value}
                    inputId="newPassword"
                    className="max-w-md pt-1"
                  />
                </>
              )}
            </FormController>

            <FormController
              name="confirmPassword"
              control={form.control}
              label="Confirm new password *"
            >
              {(field, fieldState) => (
                <PasswordInput
                  {...field}
                  id="confirmPassword"
                  aria-invalid={fieldState.invalid}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="max-w-md"
                />
              )}
            </FormController>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          type="submit"
          size="sm"
          form="change-password-form"
          disabled={!isValid || isPending}
        >
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? 'Changing...' : 'Change password'}
        </Button>
      </CardFooter>
    </Card>
  )
}

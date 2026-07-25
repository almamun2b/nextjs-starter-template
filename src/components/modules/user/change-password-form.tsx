'use client'

import { changeMyPassword } from '@/app/actions/user'
import { PasswordInput } from '@/components/modules/auth/password-input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { TChangePasswordForm } from '@/types/user.types'
import { changePasswordSchema } from '@/validation/user.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your account password. You&apos;ll need to enter your current
          password first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="change-password-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="oldPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="responsive"
                  className="grid grid-cols-1 md:grid-cols-2"
                >
                  <FieldContent className="flex flex-col gap-1">
                    <FieldLabel htmlFor={field.name}>
                      Current Password{' '}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1">
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
                  </div>
                </Field>
              )}
            />
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="responsive"
                  className="grid grid-cols-1 md:grid-cols-2"
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
                  <div className="flex flex-col gap-1">
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
                  </div>
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
                  className="grid grid-cols-1 md:grid-cols-2"
                >
                  <FieldContent className="flex flex-col gap-1">
                    <FieldLabel htmlFor={field.name}>
                      Confirm New Password{' '}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1">
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
                  </div>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button
          type="submit"
          size="sm"
          form="change-password-form"
          disabled={!isValid || isPending}
          className="h-9"
        >
          {isPending ? (
            <>
              Changing...
              <Loader2Icon className="ml-1.5 size-3.5 animate-spin" />
            </>
          ) : (
            'Change Password'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

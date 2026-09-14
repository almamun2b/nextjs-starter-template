'use client'

import { registerUser } from '@/app/actions/auth'
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
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/modules/auth/password-input'
import { isFormInputField } from '@/lib/form'
import { TRegisterForm } from '@/types/auth.types'
import { registerFormSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type TSignupFormProps = React.ComponentProps<'div'>

export function SignupForm({ ...props }: TSignupFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<TRegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const onSubmit = (data: TRegisterForm) => {
    startTransition(async () => {
      const result = await registerUser(data)

      if (result.success) {
        toast.success(result.message)
        form.reset()
        router.replace(`/verify-email?email=${encodeURIComponent(data.email)}`)
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
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormController
                name="firstName"
                control={form.control}
                orientation="responsive"
                label={
                  <>
                    First Name <span className="text-destructive">*</span>
                  </>
                }
              >
                {(field, fieldState) => (
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="John"
                    autoComplete="on"
                    className="h-9 max-w-md"
                  />
                )}
              </FormController>
              <FormController
                name="lastName"
                control={form.control}
                orientation="responsive"
                label={
                  <>
                    Last Name <span className="text-destructive">*</span>
                  </>
                }
              >
                {(field, fieldState) => (
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Doe"
                    autoComplete="on"
                    className="h-9 max-w-md"
                  />
                )}
              </FormController>
            </div>
            <FormController
              name="email"
              control={form.control}
              orientation="responsive"
              label={
                <>
                  Email <span className="text-destructive">*</span>
                </>
              }
              description="Enter your email address"
            >
              {(field, fieldState) => (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="john@example.com"
                  autoComplete="on"
                  className="h-9 max-w-md"
                />
              )}
            </FormController>
            <FormController
              name="password"
              control={form.control}
              orientation="responsive"
              label={
                <>
                  Password <span className="text-destructive">*</span>
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
                  ? 'Creating account...'
                  : 'Create Account'}
              </Button>
              <Button variant="outline" type="button" className="h-9">
                Sign up with Google
              </Button>
              <FieldDescription className="px-6 text-center">
                Already have an account? <Link href="/login">Sign in</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { loginUser } from '@/app/actions/auth'
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
import { TLoginInput } from '@/types/auth.types'
import { loginFormSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Controller, useForm } from 'react-hook-form'

type TLoginFormProps = React.ComponentProps<'div'>

export function LoginForm({ ...props }: TLoginFormProps) {
  const form = useForm<TLoginInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: TLoginInput) => {
    try {
      const response = await loginUser(data)
      console.log('Login response:', response)
    } catch (error) {
      console.log('Login error:', error)
    }
  }
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
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
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="responsive"
                >
                  <FieldContent className="flex flex-row items-center justify-between">
                    <FieldLabel htmlFor={field.name}>
                      Password <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Link
                      href="#"
                      className="inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </FieldContent>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
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
              <Button type="submit" className="h-9">
                Login
              </Button>
              <Button variant="outline" type="button" className="h-9">
                Login with Google
              </Button>
              <FieldDescription className="text-center">
                Don&apos;t have an account? <Link href="/signup">Sign up</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

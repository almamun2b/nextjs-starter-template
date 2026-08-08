'use client'

import { createUserManually } from '@/app/actions/user'
import { PasswordInput } from '@/components/modules/auth/password-input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '@/constant/user'
import { isFormInputField } from '@/lib/form'
import type { TCreateUserForm, TCreateUserInput } from '@/types/user.types'
import { createUserSchema } from '@/validation/user.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const

interface CreateUserDialogProps {
  trigger: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateUserDialog({
  trigger,
  open,
  onOpenChange,
  onCreated,
}: CreateUserDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<TCreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      role: 'USER',
      status: 'ACTIVE',
    },
    mode: 'onChange',
  })

  const onSubmit = (data: TCreateUserForm) => {
    startTransition(async () => {
      const payload: TCreateUserInput = {
        email: data.email,
        password: data.password,
        username: data.username || undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        phone: data.phone || undefined,
        gender: (data.gender ||
          undefined) as unknown as TCreateUserInput['gender'],
        role: data.role as unknown as TCreateUserInput['role'],
        status: data.status as unknown as TCreateUserInput['status'],
      }

      const result = await createUserManually(payload)

      if (result.success) {
        toast.success(result.message)
        form.reset()
        onOpenChange(false)
        onCreated()
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) form.reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a new user account. They can sign in with the credentials you
            set below.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-user-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-h-[60vh] overflow-y-auto pr-1"
        >
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        Email <span className="text-destructive">*</span>
                      </FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      placeholder="jane@example.com"
                      className="h-9"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="janedoe"
                      className="h-9"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        Password <span className="text-destructive">*</span>
                      </FieldLabel>
                    </FieldContent>
                    <PasswordInput
                      {...field}
                      id={field.name}
                      placeholder="********"
                      className="h-9"
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
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        Confirm password{' '}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                    </FieldContent>
                    <PasswordInput
                      {...field}
                      id={field.name}
                      placeholder="********"
                      className="h-9"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>First name</FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Jane"
                      className="h-9"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Doe"
                      className="h-9"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="+1234567890"
                      className="h-9"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
                    </FieldContent>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={field.name} className="h-9 w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                    </FieldContent>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={field.name} className="h-9 w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                    </FieldContent>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={field.name} className="h-9 w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            size="sm"
            disabled={isPending || !form.formState.isValid}
          >
            {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
            {isPending ? 'Creating...' : 'Create user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

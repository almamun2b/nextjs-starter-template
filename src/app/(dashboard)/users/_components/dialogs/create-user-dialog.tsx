'use client'

import { createUserManually } from '@/app/actions/user'
import { FormController } from '@/components/shared/FormController'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  USER_GENDER_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
} from '@/constant/user'
import { isFormInputField } from '@/lib/form'
import { type TCreateUserInput } from '@/types/user.types'
import {
  createUserSchema,
  type TCreateUserForm,
} from '@/validation/user.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  toGenderParam,
  toRoleParam,
  toStatusParam,
  type TUserGenderValue,
  type TUserRoleValue,
  type TUserStatusValue,
} from '../../_lib/user-enum'

interface CreateUserDialogProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateUserDialog({
  onClose,
  onSuccess,
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
      role: '',
      status: '',
    },
    mode: 'onChange',
  })

  const onSubmit = (data: TCreateUserForm) => {
    startTransition(async () => {
      const payload: TCreateUserInput = {
        email: data.email,
        password: data.password,
        ...(data.username ? { username: data.username } : {}),
        ...(data.firstName ? { firstName: data.firstName } : {}),
        ...(data.lastName ? { lastName: data.lastName } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.gender
          ? { gender: toGenderParam(data.gender as TUserGenderValue) }
          : {}),
        ...(data.role
          ? { role: toRoleParam(data.role as TUserRoleValue) }
          : {}),
        ...(data.status
          ? { status: toStatusParam(data.status as TUserStatusValue) }
          : {}),
      }

      // `createUserManually` returns an error union rather than throwing.
      const result = await createUserManually(payload)

      if (result.success) {
        toast.success(result.message)
        onSuccess()
        onClose()
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
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create an account manually. The user can sign in immediately with
            these credentials.
          </DialogDescription>
        </DialogHeader>

        <form id="create-user-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormController name="email" control={form.control} label="Email *">
              {(field) => (
                <Input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="off"
                  placeholder="jon@example.com"
                />
              )}
            </FormController>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormController
                name="password"
                control={form.control}
                label="Password *"
              >
                {(field) => (
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                )}
              </FormController>
              <FormController
                name="confirmPassword"
                control={form.control}
                label="Confirm password *"
              >
                {(field) => (
                  <Input
                    {...field}
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                )}
              </FormController>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormController
                name="firstName"
                control={form.control}
                label="First name"
              >
                {(field) => (
                  <Input {...field} id="firstName" placeholder="Jon" />
                )}
              </FormController>
              <FormController
                name="lastName"
                control={form.control}
                label="Last name"
              >
                {(field) => (
                  <Input {...field} id="lastName" placeholder="Snow" />
                )}
              </FormController>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormController
                name="username"
                control={form.control}
                label="Username"
              >
                {(field) => (
                  <Input {...field} id="username" placeholder="jonsnow" />
                )}
              </FormController>
              <FormController name="phone" control={form.control} label="Phone">
                {(field) => (
                  <Input {...field} id="phone" placeholder="+1 555 0100" />
                )}
              </FormController>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <FormController name="role" control={form.control} label="Role">
                {(field) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormController>
              <FormController
                name="status"
                control={form.control}
                label="Status"
              >
                {(field) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormController>
              <FormController
                name="gender"
                control={form.control}
                label="Gender"
              >
                {(field) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue placeholder="Unspecified" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormController>
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" disabled={isPending}>
            {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
            {isPending ? 'Creating...' : 'Create user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

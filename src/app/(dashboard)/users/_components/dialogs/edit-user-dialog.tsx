'use client'

import { updateUserById } from '@/app/actions/user'
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
import { Textarea } from '@/components/ui/textarea'
import { USER_GENDER_OPTIONS } from '@/constant/user'
import { isFormInputField } from '@/lib/form'
import { type TUpdateProfileInput, type IUser } from '@/types/user.types'
import { profileFormSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v3'
import {
  readUserGender,
  toGenderParam,
  type TUserGenderValue,
} from '../../_lib/user-enum'

type TEditUserForm = z.infer<typeof profileFormSchema>

function toDateInputValue(value: Date | string | null): string {
  if (!value) return ''
  const parsed = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().split('T')[0]
}

interface EditUserDialogProps {
  user: IUser
  onClose: () => void
  onSuccess: () => void
}

export function EditUserDialog({
  user,
  onClose,
  onSuccess,
}: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<TEditUserForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      bio: user.bio ?? '',
      gender: readUserGender(user.gender) ?? '',
      address: user.address ?? '',
      dateOfBirth: toDateInputValue(user.dateOfBirth),
      timezone: user.timezone ?? '',
      locale: user.locale ?? '',
    },
    mode: 'onChange',
  })

  const onSubmit = (data: TEditUserForm) => {
    startTransition(async () => {
      const payload: TUpdateProfileInput = {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        bio: data.bio || null,
        gender: data.gender
          ? toGenderParam(data.gender as TUserGenderValue)
          : null,
        address: data.address || null,
        dateOfBirth: data.dateOfBirth || null,
        timezone: data.timezone || null,
        locale: data.locale || null,
      }

      // `updateUserById` returns an error union rather than throwing.
      const result = await updateUserById(user.id, payload)

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
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update profile details for{' '}
            <span className="font-medium">{user.email}</span>.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
              <FormController name="phone" control={form.control} label="Phone">
                {(field) => (
                  <Input {...field} id="phone" placeholder="+1 555 0100" />
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormController
                name="dateOfBirth"
                control={form.control}
                label="Date of birth"
              >
                {(field) => <Input {...field} id="dateOfBirth" type="date" />}
              </FormController>
              <FormController
                name="timezone"
                control={form.control}
                label="Timezone"
              >
                {(field) => (
                  <Input {...field} id="timezone" placeholder="Asia/Dhaka" />
                )}
              </FormController>
            </div>

            <FormController
              name="address"
              control={form.control}
              label="Address"
            >
              {(field) => (
                <Input {...field} id="address" placeholder="Street, City" />
              )}
            </FormController>

            <FormController name="bio" control={form.control} label="Bio">
              {(field) => (
                <Textarea
                  {...field}
                  id="bio"
                  rows={3}
                  placeholder="Short description"
                />
              )}
            </FormController>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
            {isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

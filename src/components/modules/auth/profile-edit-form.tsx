'use client'

import { updateMyProfile } from '@/app/actions/user'
import { EmptyState } from '@/components/shared/empty-state'
import { FormController } from '@/components/shared/FormController'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { USER_GENDER_OPTIONS } from '@/constant/user'
import { date } from '@/lib/date'
import { isFormInputField } from '@/lib/form'
import {
  getUserDisplayName,
  getUserInitials,
  readUserGender,
} from '@/lib/user-format'
import { useAuth } from '@/providers/auth-provider'
import type { TUpdateProfileInput } from '@/types/user.types'
import { profileFormSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, UserXIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v3'

type FormData = z.infer<typeof profileFormSchema>

export function ProfileEditForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      bio: user?.bio ?? '',
      gender: (user
        ? (readUserGender(user.gender) ?? '')
        : '') as FormData['gender'],
      address: user?.address ?? '',
      dateOfBirth: date.toDateInputValue(user?.dateOfBirth ?? null),
      timezone: user?.timezone ?? '',
      locale: user?.locale ?? '',
    },
    mode: 'onChange',
  })

  if (!user) {
    return (
      <EmptyState
        icon={UserXIcon}
        tone="destructive"
        title="Failed to load profile"
        description="Please try again later."
      />
    )
  }

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const genderValue = (data.gender || null) as TUpdateProfileInput['gender']

      const payload: TUpdateProfileInput = {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        bio: data.bio || null,
        gender: genderValue,
        address: data.address || null,
        dateOfBirth: data.dateOfBirth || null,
        timezone: data.timezone || null,
        locale: data.locale || null,
      }

      const result = await updateMyProfile(payload)

      if (result.success) {
        toast.success(result.message)
        router.push('/profile')
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

  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(user)
  const avatarUrl = user.avatar?.url ?? null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback className="text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Edit profile</CardTitle>
              <CardDescription>
                Update {displayName}&apos;s personal information below
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile" aria-label="Back to profile">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form id="profile-edit-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Personal Information
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormController
                name="firstName"
                control={form.control}
                label="First name"
              >
                {(field) => (
                  <Input {...field} id="firstName" placeholder="John" />
                )}
              </FormController>
              <FormController
                name="lastName"
                control={form.control}
                label="Last name"
              >
                {(field) => (
                  <Input {...field} id="lastName" placeholder="Doe" />
                )}
              </FormController>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormController
                name="gender"
                control={form.control}
                label="Gender"
              >
                {(field) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue placeholder="Select gender" />
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
              <FormController
                name="dateOfBirth"
                control={form.control}
                label="Date of birth"
              >
                {(field) => <Input {...field} id="dateOfBirth" type="date" />}
              </FormController>
            </div>

            <Separator className="my-2" />

            <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Contact
            </div>
            <FormController name="phone" control={form.control} label="Phone">
              {(field) => (
                <Input {...field} id="phone" placeholder="+1234567890" />
              )}
            </FormController>
            <FormController
              name="address"
              control={form.control}
              label="Address"
            >
              {(field) => (
                <Textarea
                  {...field}
                  id="address"
                  placeholder="Your address"
                  rows={2}
                />
              )}
            </FormController>

            <Separator className="my-2" />

            <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              About
            </div>
            <FormController name="bio" control={form.control} label="Bio">
              {(field) => (
                <Textarea
                  {...field}
                  id="bio"
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              )}
            </FormController>

            <Separator className="my-2" />

            <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Localization
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormController
                name="timezone"
                control={form.control}
                label="Timezone"
              >
                {(field) => (
                  <Input
                    {...field}
                    id="timezone"
                    placeholder="America/New_York"
                  />
                )}
              </FormController>
              <FormController
                name="locale"
                control={form.control}
                label="Locale"
              >
                {(field) => (
                  <Input {...field} id="locale" placeholder="en-US" />
                )}
              </FormController>
            </div>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/profile">Cancel</Link>
        </Button>
        <Button
          type="submit"
          size="sm"
          form="profile-edit-form"
          disabled={isPending}
        >
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}

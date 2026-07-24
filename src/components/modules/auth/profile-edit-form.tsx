'use client'

import { updateMyProfile } from '@/app/actions/user'
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
import { Separator } from '@/components/ui/separator'
import { isFormInputField } from '@/lib/form'
import {
  Gender,
  type IUser,
  type TUpdateProfileInput,
} from '@/types/user.types'
import { profileFormSchema } from '@/validation/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v3'

interface ProfileEditFormProps {
  user: IUser
}

type FormData = z.infer<typeof profileFormSchema>

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const

function getInitials(user: IUser): string {
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase()
  }
  return user.email[0].toUpperCase()
}

function toDateInputValue(value: string | Date | null): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      bio: user.bio ?? '',
      gender:
        user.gender !== null && user.gender !== undefined
          ? ((typeof user.gender === 'number'
              ? Gender[user.gender]
              : user.gender) as FormData['gender'])
          : '',
      address: user.address ?? '',
      dateOfBirth: toDateInputValue(user.dateOfBirth),
      timezone: user.timezone ?? '',
      locale: user.locale ?? '',
    },
    mode: 'onChange',
  })

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

  const initials = getInitials(user)
  const avatarUrl = user.avatar?.url ?? null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 rounded-full ring-2 ring-border">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={initials} />}
                <AvatarFallback className="rounded-full text-base font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your personal information below
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Personal Information
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
                        placeholder="John"
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
                  name="gender"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
                      </FieldContent>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id={field.name} className="h-9">
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
                <Controller
                  name="dateOfBirth"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>
                          Date of birth
                        </FieldLabel>
                      </FieldContent>
                      <Input
                        {...field}
                        id={field.name}
                        type="date"
                        className="h-9"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Separator className="my-2" />

              <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Contact
              </div>
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
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                    </FieldContent>
                    <textarea
                      {...field}
                      id={field.name}
                      placeholder="Your address"
                      rows={2}
                      className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Separator className="my-2" />

              <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                About
              </div>
              <Controller
                name="bio"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
                    </FieldContent>
                    <textarea
                      {...field}
                      id={field.name}
                      placeholder="Tell us about yourself"
                      rows={3}
                      className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Separator className="my-2" />

              <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Localization
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Controller
                  name="timezone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>Timezone</FieldLabel>
                      </FieldContent>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="America/New_York"
                        className="h-9"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="locale"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>Locale</FieldLabel>
                      </FieldContent>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="en-US"
                        className="h-9"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile">Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending && (
              <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
            )}
            {isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

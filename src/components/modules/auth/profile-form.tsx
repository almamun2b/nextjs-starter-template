'use client'

import { updateMyProfile } from '@/app/actions/user'
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { IUser, TUpdateProfileInput } from '@/types/user.types'
import { PencilIcon, XIcon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface ProfileFormProps {
  user: IUser
}

type FormData = {
  firstName: string
  lastName: string
  phone: string
  bio: string
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      bio: user.bio ?? '',
    },
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const payload: TUpdateProfileInput = {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        bio: data.bio || null,
      }

      const result = await updateMyProfile(payload)

      if (result.success) {
        toast.success(result.message)
        setIsEditing(false)
        return
      }

      toast.error(result.message)
    })
  }

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="mr-1 size-3.5" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">First name</dt>
              <dd className="font-medium">{user.firstName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Last name</dt>
              <dd className="font-medium">{user.lastName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Phone</dt>
              <dd className="font-medium">{user.phone ?? '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Bio</dt>
              <dd className="font-medium">{user.bio ?? '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(false)
              form.reset()
            }}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
                    className="h-9 max-w-md"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
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
                    className="h-20 max-w-md rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" className="h-9" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => {
                  setIsEditing(false)
                  form.reset()
                }}
              >
                Cancel
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

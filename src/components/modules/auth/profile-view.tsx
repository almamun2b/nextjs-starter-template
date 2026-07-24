'use client'

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
import { Separator } from '@/components/ui/separator'
import { Gender, type IUser } from '@/types/user.types'
import { PencilIcon } from 'lucide-react'
import Link from 'next/link'

interface ProfileViewProps {
  user: IUser
}

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const

const GENDER_LABELS = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label])
)

function getInitials(user: IUser): string {
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase()
  }
  return user.email[0].toUpperCase()
}

function toDateValue(value: string | Date | null): Date | null {
  if (!value) return null
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null
  return date
}

function formatDate(value: string | Date | null): string {
  const date = toDateValue(value)
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

export function ProfileView({ user }: ProfileViewProps) {
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
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/edit">
                <PencilIcon className="mr-1 size-3.5" />
                Edit
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Personal Information
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="First name" value={user.firstName ?? '—'} />
            <FieldRow label="Last name" value={user.lastName ?? '—'} />
            <FieldRow label="Username" value={user.username ?? '—'} />
            <FieldRow label="Email" value={user.email} />
            <FieldRow
              label="Gender"
              value={
                user.gender !== null && user.gender !== undefined
                  ? (GENDER_LABELS[
                      typeof user.gender === 'number'
                        ? Gender[user.gender]
                        : user.gender
                    ] ?? '—')
                  : '—'
              }
            />
            <FieldRow
              label="Date of birth"
              value={formatDate(user.dateOfBirth) || '—'}
            />
          </dl>

          <Separator className="my-5" />

          <div className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Contact
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="Phone" value={user.phone ?? '—'} />
            <FieldRow label="Address" value={user.address ?? '—'} />
          </dl>

          <Separator className="my-5" />

          <div className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            About
          </div>
          <dl className="grid grid-cols-1 gap-4">
            <FieldRow label="Bio" value={user.bio ?? '—'} />
          </dl>

          <Separator className="my-5" />

          <div className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Localization
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="Timezone" value={user.timezone ?? '—'} />
            <FieldRow label="Locale" value={user.locale ?? '—'} />
          </dl>
        </CardContent>

        <CardFooter className="border-t px-6 py-4">
          <Button variant="default" size="sm" asChild className="ml-auto">
            <Link href="/profile/edit">
              <PencilIcon className="mr-1 size-3.5" />
              Edit profile
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

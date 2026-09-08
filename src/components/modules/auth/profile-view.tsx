'use client'

import { ProfileAvatarUploader } from '@/components/modules/user/profile-avatar-uploader'
import { Badge } from '@/components/ui/badge'
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
import { date } from '@/lib/date'
import {
  getGenderLabel,
  getRoleBadgeVariant,
  getRoleLabel,
  getStatusBadgeVariant,
  getStatusLabel,
} from '@/lib/user-format'
import { useAuth } from '@/providers/auth-provider'
import { CheckCircle2Icon, MinusCircleIcon, PencilIcon } from 'lucide-react'
import Link from 'next/link'

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

export function ProfileView() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        Failed to load profile. Please try again later.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProfileAvatarUploader user={user} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
            <Badge variant={getStatusBadgeVariant(user.status)}>
              {getStatusLabel(user.status)}
            </Badge>
            {user.isVerified ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                <CheckCircle2Icon className="size-3.5 text-primary" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MinusCircleIcon className="size-3.5" />
                Unverified
              </span>
            )}
          </div>
        </div>
        <div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
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
          <FieldRow label="Gender" value={getGenderLabel(user.gender) ?? '—'} />
          <FieldRow
            label="Date of birth"
            value={date.formatOrDash(user.dateOfBirth, 'MMMM d, yyyy')}
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

        <Separator className="my-5" />

        <div className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Account
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow
            label="Member since"
            value={date.formatOrDash(user.createdAt, 'MMMM d, yyyy')}
          />
          <FieldRow
            label="Last login"
            value={date.formatOrDash(user.lastLoginAt)}
          />
        </dl>
      </CardContent>

      <CardFooter className="justify-end">
        <Button variant="default" size="sm" asChild>
          <Link href="/profile/edit">
            <PencilIcon className="size-3.5" />
            Edit profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

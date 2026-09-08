'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { date } from '@/lib/date'
import { type IUser } from '@/types/user.types'
import { type ReactNode } from 'react'
import {
  getGenderLabel,
  getRoleBadgeVariant,
  getRoleLabel,
  getStatusBadgeVariant,
  getStatusLabel,
} from '../../_lib/user-enum'
import { getUserDisplayName, getUserInitials } from '@/lib/user-format'

interface UserViewDialogProps {
  user: IUser
  onClose: () => void
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm break-words">{children}</dd>
    </div>
  )
}

function formatDate(value: Date | string | null): string {
  if (!value) return '—'
  try {
    return date.utcToLocal(value)
  } catch {
    return '—'
  }
}

export function UserViewDialog({ user, onClose }: UserViewDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {user.avatar?.url && (
              <AvatarImage
                src={user.avatar.url}
                alt={getUserDisplayName(user)}
              />
            )}
            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{getUserDisplayName(user)}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <Separator />

        <dl className="divide-y">
          <DetailRow label="Role">
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
          </DetailRow>
          <DetailRow label="Status">
            <Badge variant={getStatusBadgeVariant(user.status)}>
              {getStatusLabel(user.status)}
            </Badge>
          </DetailRow>
          <DetailRow label="Verified">
            {user.isVerified ? 'Yes' : 'No'}
          </DetailRow>
          <DetailRow label="Username">{user.username ?? '—'}</DetailRow>
          <DetailRow label="Phone">{user.phone ?? '—'}</DetailRow>
          <DetailRow label="Gender">
            {getGenderLabel(user.gender) ?? '—'}
          </DetailRow>
          <DetailRow label="Address">{user.address ?? '—'}</DetailRow>
          <DetailRow label="Bio">{user.bio ?? '—'}</DetailRow>
          <DetailRow label="Last login">
            {formatDate(user.lastLoginAt)}
          </DetailRow>
          <DetailRow label="Joined">{formatDate(user.createdAt)}</DetailRow>
        </dl>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

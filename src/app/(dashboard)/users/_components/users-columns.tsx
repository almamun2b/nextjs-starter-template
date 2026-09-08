'use client'

import { type TTableColumn } from '@/components/shared/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { date } from '@/lib/date'
import { type IUser } from '@/types/user.types'
import { CheckCircle2Icon, MinusCircleIcon } from 'lucide-react'
import { type TUserDialogAction } from '../_lib/user-dialog'
import { getUserDisplayName, getUserInitials } from '@/lib/user-format'
import {
  getRoleBadgeVariant,
  getRoleLabel,
  getStatusBadgeVariant,
  getStatusLabel,
} from '../_lib/user-enum'
import { USERS_COLUMN_META } from '../_lib/users-query'
import { UserActionsMenu } from './user-actions-menu'

function formatDate(value: Date | string | null): string {
  if (!value) return '—'
  try {
    return date.utcToLocal(value, 'MMM dd, yyyy')
  } catch {
    return '—'
  }
}

interface GetUsersColumnsOptions {
  canManageRoles: boolean
  viewerId: string | null
  onAction: (action: TUserDialogAction, user: IUser) => void
}

/**
 * Attaches cell renderers to the shared column metadata. Geometry (keys,
 * widths, labels, sortability) comes from `USERS_COLUMN_META` so this stays in
 * lockstep with the server-rendered skeleton.
 */
export function getUsersColumns({
  canManageRoles,
  viewerId,
  onAction,
}: GetUsersColumnsOptions): TTableColumn<IUser>[] {
  const renderers: Record<string, TTableColumn<IUser>['render']> = {
    email: (user) => (
      <div className="flex items-center gap-3">
        <Avatar>
          {user.avatar?.url && (
            <AvatarImage src={user.avatar.url} alt={getUserDisplayName(user)} />
          )}
          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {getUserDisplayName(user)}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    ),
    role: (user) => (
      <Badge variant={getRoleBadgeVariant(user.role)}>
        {getRoleLabel(user.role)}
      </Badge>
    ),
    status: (user) => (
      <Badge variant={getStatusBadgeVariant(user.status)}>
        {getStatusLabel(user.status)}
      </Badge>
    ),
    isVerified: (user) =>
      user.isVerified ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
          <CheckCircle2Icon className="size-3.5 text-primary" />
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MinusCircleIcon className="size-3.5" />
          No
        </span>
      ),
    lastLoginAt: (user) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(user.lastLoginAt)}
      </span>
    ),
    createdAt: (user) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(user.createdAt)}
      </span>
    ),
    actions: (user) => (
      <UserActionsMenu
        user={user}
        canManageRoles={canManageRoles}
        isSelf={viewerId === user.id}
        onAction={onAction}
      />
    ),
  }

  return USERS_COLUMN_META.map((meta) => ({
    ...meta,
    render: renderers[meta.key],
  }))
}

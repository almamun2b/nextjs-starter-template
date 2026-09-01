'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type IUser } from '@/types/user.types'
import {
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
  UserCogIcon,
} from 'lucide-react'
import { type TUserDialogAction } from '../_lib/user-dialog'

interface UserActionsMenuProps {
  user: IUser
  /** Viewer is a SUPER_ADMIN — required for role changes and hard deletes. */
  canManageRoles: boolean
  /** The row is the signed-in user; self-destructive actions are blocked. */
  isSelf: boolean
  onAction: (action: TUserDialogAction, user: IUser) => void
}

export function UserActionsMenu({
  user,
  canManageRoles,
  isSelf,
  onAction,
}: UserActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${user.email}`}
        >
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onAction('view', user)}>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction('edit', user)}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isSelf}
          onSelect={() => onAction('status', user)}
        >
          <UserCogIcon />
          Change status
        </DropdownMenuItem>
        {canManageRoles && (
          <DropdownMenuItem
            disabled={isSelf}
            onSelect={() => onAction('role', user)}
          >
            <ShieldIcon />
            Change role
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={isSelf}
          onSelect={() => onAction('delete-soft', user)}
        >
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
        {canManageRoles && (
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onSelect={() => onAction('delete-hard', user)}
          >
            <Trash2Icon />
            Delete permanently
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

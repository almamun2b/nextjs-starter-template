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
import { type IAbility, type TUserAbilities } from '../_lib/user-abilities'
import { type TUserDialogAction } from '../_lib/user-dialog'

interface UserActionsMenuProps {
  user: IUser
  /** Per-row permission verdicts from `buildUserAbilities`. */
  abilities: TUserAbilities
  onAction: (action: TUserDialogAction, user: IUser) => void
}

interface ActionItemProps {
  ability: IAbility
  icon: React.ComponentType<{ className?: string }>
  label: string
  destructive?: boolean
  onSelect: () => void
}

/**
 * Hidden when the viewer's role never permits the action, disabled with an
 * explanation when only this particular row is off limits.
 */
function ActionItem({
  ability,
  icon: Icon,
  label,
  destructive,
  onSelect,
}: ActionItemProps) {
  if (!ability.held) return null

  return (
    <DropdownMenuItem
      variant={destructive ? 'destructive' : undefined}
      disabled={!ability.allowed}
      title={ability.reason ?? undefined}
      onSelect={onSelect}
    >
      <Icon />
      {label}
    </DropdownMenuItem>
  )
}

export function UserActionsMenu({
  user,
  abilities,
  onAction,
}: UserActionsMenuProps) {
  const select = (action: TUserDialogAction) => () => onAction(action, user)
  const hasManagementItems = abilities.status.held || abilities.role.held
  const hasDeleteItems =
    abilities['delete-soft'].held || abilities['delete-hard'].held

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
        <ActionItem
          ability={abilities.view}
          icon={EyeIcon}
          label="View details"
          onSelect={select('view')}
        />
        <ActionItem
          ability={abilities.edit}
          icon={PencilIcon}
          label="Edit"
          onSelect={select('edit')}
        />

        {hasManagementItems && <DropdownMenuSeparator />}

        <ActionItem
          ability={abilities.status}
          icon={UserCogIcon}
          label="Change status"
          onSelect={select('status')}
        />
        <ActionItem
          ability={abilities.role}
          icon={ShieldIcon}
          label="Change role"
          onSelect={select('role')}
        />

        {hasDeleteItems && <DropdownMenuSeparator />}

        <ActionItem
          ability={abilities['delete-soft']}
          icon={Trash2Icon}
          label="Delete"
          destructive
          onSelect={select('delete-soft')}
        />
        <ActionItem
          ability={abilities['delete-hard']}
          icon={Trash2Icon}
          label="Delete permanently"
          destructive
          onSelect={select('delete-hard')}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

'use client'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '@/constant/user'
import { date } from '@/lib/date'
import { normalizeEnumValue } from '@/lib/enum'
import type { SortOrder } from '@/types/response.types'
import { UserRole, UserStatus, type IUser } from '@/types/user.types'
import type { ColumnDef, RowData } from '@tanstack/react-table'
import {
  BadgeCheckIcon,
  MinusCircleIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  UserXIcon,
} from 'lucide-react'
import { RoleBadge, StatusBadge } from './user-badges'

/**
 * Dynamic (per-render) state/callbacks for the users table, threaded through
 * `table.options.meta` instead of being baked into column defs as closures.
 * Column defs are created once and read `table.options.meta` fresh on every
 * render via `flexRender`'s header/cell context — baking callbacks into the
 * columns array via closures instead is a known tanstack-table footgun that
 * causes stale handlers when the columns array can't be perfectly memoized.
 */
interface UsersTableMeta {
  currentUserId?: string
  currentUserRole?: UserRole | string | null
  sortBy?: string
  sortOrder?: SortOrder
  onSort: (columnId: string) => void
  onChangeStatus: (user: IUser, status: string) => void
  onChangeRole: (user: IUser, role: string) => void
  onSoftDelete: (user: IUser) => void
  onHardDelete: (user: IUser) => void
  pendingId?: string | null
}

declare module '@tanstack/react-table' {
  // Module augmentation requires `interface extends`; TanStack's `TableMeta`
  // is empty by default and only gains members via merging like this.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> extends UsersTableMeta {}
}

function getInitials(user: IUser): string {
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase()
  }
  return user.email[0].toUpperCase()
}

const usersColumns: ColumnDef<IUser>[] = [
  {
    id: 'user',
    header: ({ table }) => {
      const meta = table.options.meta as UsersTableMeta
      return (
        <DataTableColumnHeader
          title="User"
          sorted={meta.sortBy === 'email' ? (meta.sortOrder ?? 'asc') : false}
          onSort={() => meta.onSort('email')}
        />
      )
    },
    cell: ({ row }) => {
      const user = row.original
      const initials = getInitials(user)
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
      return (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8 rounded-full">
            {user.avatar?.url && (
              <AvatarImage src={user.avatar.url} alt={initials} />
            )}
            <AvatarFallback className="rounded-full text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{name || '—'}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      )
    },
  },
  {
    id: 'username',
    header: 'Username',
    cell: ({ row }) => row.original.username ?? '—',
  },
  {
    id: 'role',
    header: 'Role',
    cell: ({ row }) => <RoleBadge role={row.original.role} />,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'isVerified',
    header: 'Verified',
    cell: ({ row }) =>
      row.original.isVerified ? (
        <BadgeCheckIcon className="size-4 text-primary" />
      ) : (
        <MinusCircleIcon className="size-4 text-muted-foreground/50" />
      ),
  },
  {
    id: 'lastLoginAt',
    header: ({ table }) => {
      const meta = table.options.meta as UsersTableMeta
      return (
        <DataTableColumnHeader
          title="Last login"
          sorted={
            meta.sortBy === 'lastLoginAt' ? (meta.sortOrder ?? 'asc') : false
          }
          onSort={() => meta.onSort('lastLoginAt')}
        />
      )
    },
    cell: ({ row }) =>
      row.original.lastLoginAt
        ? date.utcToLocal(row.original.lastLoginAt, 'MMM dd, yyyy')
        : '—',
  },
  {
    id: 'createdAt',
    header: ({ table }) => {
      const meta = table.options.meta as UsersTableMeta
      return (
        <DataTableColumnHeader
          title="Created"
          sorted={
            meta.sortBy === 'createdAt' ? (meta.sortOrder ?? 'asc') : false
          }
          onSort={() => meta.onSort('createdAt')}
        />
      )
    },
    cell: ({ row }) => date.utcToLocal(row.original.createdAt, 'MMM dd, yyyy'),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta
      const user = row.original
      const isSelf = meta.currentUserId === user.id
      const isPending = meta.pendingId === user.id
      const isSuperAdmin =
        normalizeEnumValue(UserRole, meta.currentUserRole ?? undefined) ===
        'SUPER_ADMIN'

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" disabled={isPending}>
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Open actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={normalizeEnumValue(UserStatus, user.status)}
                >
                  {USER_STATUS_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => meta.onChangeStatus(user, option.value)}
                    >
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {isSuperAdmin && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Change role</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={normalizeEnumValue(UserRole, user.role)}
                  >
                    {USER_ROLE_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => meta.onChangeRole(user, option.value)}
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            <DropdownMenuSeparator />

            <ConfirmDialog
              trigger={
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSelf}
                  onSelect={(event) => event.preventDefault()}
                >
                  <UserXIcon /> Soft delete
                </DropdownMenuItem>
              }
              title="Soft delete this user?"
              description={`${user.email} will be deactivated and hidden, but can be restored later.`}
              confirmLabel="Soft delete"
              destructive
              isPending={isPending}
              onConfirm={() => meta.onSoftDelete(user)}
            />

            {isSuperAdmin && (
              <ConfirmDialog
                trigger={
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isSelf}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Trash2Icon /> Hard delete
                  </DropdownMenuItem>
                }
                title="Permanently delete this user?"
                description={`This will permanently delete ${user.email} and cannot be undone.`}
                confirmLabel="Delete permanently"
                destructive
                isPending={isPending}
                onConfirm={() => meta.onHardDelete(user)}
              />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function getUsersColumns(): ColumnDef<IUser>[] {
  return usersColumns
}

export { getUsersColumns }
export type { UsersTableMeta }

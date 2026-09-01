'use client'

import { useState } from 'react'
import { useFetch } from '@/lib/fetch/use-fetch'
import { getAllUsers } from '@/app/actions/user'
import {
  type TUserQueryOptions,
  type TUsersResponse,
  type IUser,
} from '@/types/user.types'
import {
  DataTable,
  TablePagination,
  TableToolbar,
  TableFilter,
} from '@/components/shared/table'
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '@/constant/user'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  MoreVerticalIcon,
  UserIcon,
  EditIcon,
  Trash2Icon,
  ShieldIcon,
  UserCheckIcon,
  UserXIcon,
} from 'lucide-react'

const USER_VERIFIED_OPTIONS = [
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
] as const

const roleBadgeVariants: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
> = {
  SUPER_ADMIN: 'destructive',
  ADMIN: 'default',
  USER: 'secondary',
}

const statusBadgeVariants: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
> = {
  ACTIVE: 'default',
  PENDING: 'secondary',
  INACTIVE: 'outline',
  SUSPENDED: 'destructive',
  BANNED: 'destructive',
  DELETED: 'ghost',
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getRoleLabel(role: string): string {
  return USER_ROLE_OPTIONS.find((r) => r.value === role)?.label || role
}

function getStatusLabel(status: string): string {
  return USER_STATUS_OPTIONS.find((s) => s.value === status)?.label || status
}

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<{
    role?: string
    status?: string
    isVerified?: string
  }>({})
  const [selection, setSelection] = useState<Set<string>>(new Set())

  const setFilter = (key: keyof typeof filters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const queryParams: TUserQueryOptions = {
    page,
    limit,
    sortBy,
    sortOrder,
    searchTerm: searchTerm || undefined,
    role: filters.role as TUserQueryOptions['role'],
    status: filters.status as TUserQueryOptions['status'],
    isVerified: filters.isVerified ? filters.isVerified === 'true' : undefined,
  }

  const { data, isLoading, isError, error, execute } = useFetch<
    TUsersResponse,
    [TUserQueryOptions]
  >({
    action: getAllUsers,
    immediate: true,
    args: [queryParams],
  })

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(order)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleRefresh = () => {
    execute(queryParams)
  }

  const columns = [
    {
      key: 'avatar',
      header: '',
      accessorKey: 'avatar',
      cell: (row: IUser) => (
        <Avatar className="size-8">
          {row.avatar?.url ? (
            <AvatarImage src={row.avatar.url} alt={row.email} />
          ) : (
            <AvatarFallback>{getInitials(row.firstName)}</AvatarFallback>
          )}
        </Avatar>
      ),
      width: '48px',
      enableSorting: false,
    },
    {
      key: 'name',
      header: 'Name',
      accessorFn: (row: IUser) => (
        <div>
          <p className="font-medium">
            {row.firstName || '—'} {row.lastName || ''}
          </p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      ),
      enableSorting: true,
    },
    {
      key: 'role',
      header: 'Role',
      accessorKey: 'role',
      cell: (row: IUser) => {
        const roleStr = String(row.role)
        return (
          <Badge variant={roleBadgeVariants[roleStr] || 'secondary'}>
            {getRoleLabel(roleStr)}
          </Badge>
        )
      },
      enableSorting: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row: IUser) => {
        const statusStr = String(row.status)
        return (
          <Badge variant={statusBadgeVariants[statusStr] || 'secondary'}>
            {getStatusLabel(statusStr)}
          </Badge>
        )
      },
      enableSorting: true,
    },
    {
      key: 'verified',
      header: 'Verified',
      accessorKey: 'isVerified',
      cell: (row: IUser) => (
        <Badge variant={row.isVerified ? 'default' : 'outline'}>
          {row.isVerified ? 'Verified' : 'Unverified'}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      accessorKey: 'lastLoginAt',
      cell: (row: IUser) => (
        <span className="text-sm">{formatDate(row.lastLoginAt)}</span>
      ),
      enableSorting: true,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: (row: IUser) => (
        <span className="text-sm">{formatDate(row.createdAt)}</span>
      ),
      enableSorting: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row: IUser) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVerticalIcon className="size-4" />
              <span className="sr-only">Actions for {row.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log('View', row.id)}>
              <UserIcon className="mr-2 size-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Edit', row.id)}>
              <EditIcon className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => console.log('Change Role', row.id)}
            >
              <ShieldIcon className="mr-2 size-4" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log('Change Status', row.id)}
            >
              {String(row.status) === 'ACTIVE' ? (
                <>
                  <UserXIcon className="mr-2 size-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheckIcon className="mr-2 size-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => console.log('Delete', row.id)}
            >
              <Trash2Icon className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: '100px',
      enableSorting: false,
      align: 'center' as const,
    },
  ]

  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelection(newSelection)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage user accounts, roles, and access.
        </p>
      </div>

      <div className="card rounded-lg border">
        <div className="border-b p-4">
          <TableToolbar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search users..."
            filters={
              <div className="flex flex-wrap gap-2">
                <TableFilter
                  value={filters.role}
                  onChange={(v) => setFilter('role', v)}
                  placeholder="Role"
                  allLabel="All roles"
                  options={USER_ROLE_OPTIONS}
                  classNameTrigger="w-36"
                />
                <TableFilter
                  value={filters.status}
                  onChange={(v) => setFilter('status', v)}
                  placeholder="Status"
                  allLabel="All statuses"
                  options={USER_STATUS_OPTIONS}
                  classNameTrigger="w-36"
                />
                <TableFilter
                  value={filters.isVerified}
                  onChange={(v) => setFilter('isVerified', v)}
                  placeholder="Verified"
                  allLabel="All users"
                  options={USER_VERIFIED_OPTIONS}
                  classNameTrigger="w-36"
                />
              </div>
            }
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
            }
          />
        </div>

        <DataTable<IUser>
          columns={columns}
          data={data?.data ?? []}
          meta={data?.meta}
          isLoading={isLoading}
          selection={selection}
          onSelectionChange={handleSelectionChange}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          rowKey="id"
          emptyMessage="No users found"
          loadingMessage="Loading users..."
          showSelectionColumn
          className="w-full"
        />

        {data?.meta && (
          <div className="border-t p-4">
            <TablePagination
              meta={data.meta}
              selectedCount={selection.size}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load users: {error?.message}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}

export default UsersPage

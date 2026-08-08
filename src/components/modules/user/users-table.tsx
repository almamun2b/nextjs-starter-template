'use client'

import {
  deleteUserHard,
  deleteUserSoft,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from '@/app/actions/user'
import { DataTable } from '@/components/shared/data-table/data-table'
import { DataTablePagination } from '@/components/shared/data-table/data-table-pagination'
import { DataTableToolbar } from '@/components/shared/data-table/data-table-toolbar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '@/constant/user'
import { useDataTableQueryState } from '@/hooks/use-data-table-query-state'
import { useFetch } from '@/lib/fetch/use-fetch'
import { useAuth } from '@/providers/auth-provider'
import type {
  IUser,
  TUserQueryOptions,
  TUsersResponse,
  UserRole,
  UserStatus,
} from '@/types/user.types'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { toast } from 'sonner'
import { CreateUserDialog } from './create-user-dialog'
import { getUsersColumns } from './users-table-columns'

const ALL_VALUE = '__all__'

interface UsersTableProps {
  initialData: TUsersResponse
}

export function UsersTable({ initialData }: UsersTableProps) {
  const { user: currentUser } = useAuth()

  const {
    page,
    limit,
    sortBy,
    sortOrder,
    searchTerm,
    filters,
    setLimit,
    setSearchTerm,
    setFilter,
    toggleSort,
    getPageHref,
  } = useDataTableQueryState({
    defaultLimit: 10,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
    filterKeys: ['role', 'status', 'isVerified'],
  })

  const queryOptions: TUserQueryOptions = {
    page,
    limit,
    sortBy,
    sortOrder,
    searchTerm: searchTerm || undefined,
    role: filters.role
      ? (filters.role as unknown as TUserQueryOptions['role'])
      : undefined,
    status: filters.status
      ? (filters.status as unknown as TUserQueryOptions['status'])
      : undefined,
    isVerified:
      filters.isVerified === 'true'
        ? true
        : filters.isVerified === 'false'
          ? false
          : undefined,
  }

  const { data, isLoading, execute } = useFetch({
    action: getAllUsers,
  })

  const list = data ?? initialData
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    execute(queryOptions).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(queryOptions)])

  const [isMutating, startMutation] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const refresh = useCallback(
    () => execute(queryOptions).catch(() => {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [execute, JSON.stringify(queryOptions)]
  )

  const runMutation = useCallback(
    (id: string, action: () => Promise<{ message: string }>) => {
      setPendingId(id)
      startMutation(async () => {
        try {
          const result = await action()
          toast.success(result.message)
          await refresh()
        } catch (error) {
          toast.error((error as Error).message)
        } finally {
          setPendingId(null)
        }
      })
    },
    [refresh]
  )

  const handleChangeStatus = useCallback(
    (targetUser: IUser, status: string) => {
      runMutation(targetUser.id, () =>
        updateUserStatus(targetUser.id, {
          status: status as unknown as UserStatus,
        })
      )
    },
    [runMutation]
  )

  const handleChangeRole = useCallback(
    (targetUser: IUser, role: string) => {
      runMutation(targetUser.id, () =>
        updateUserRole(targetUser.id, { role: role as unknown as UserRole })
      )
    },
    [runMutation]
  )

  const handleSoftDelete = useCallback(
    (targetUser: IUser) => {
      runMutation(targetUser.id, () => deleteUserSoft(targetUser.id))
    },
    [runMutation]
  )

  const handleHardDelete = useCallback(
    (targetUser: IUser) => {
      runMutation(targetUser.id, () => deleteUserHard(targetUser.id))
    },
    [runMutation]
  )

  const columns = useMemo(() => getUsersColumns(), [])

  const table = useReactTable({
    data: list.data,
    columns,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: list.meta.totalPage,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: {
      currentUserId: currentUser?.id,
      currentUserRole: currentUser?.role,
      sortBy,
      sortOrder,
      onSort: toggleSort,
      onChangeStatus: handleChangeStatus,
      onChangeRole: handleChangeRole,
      onSoftDelete: handleSoftDelete,
      onHardDelete: handleHardDelete,
      pendingId: isMutating ? pendingId : null,
    },
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        searchPlaceholder="Search by name, email, or username..."
        filters={
          <>
            <Select
              value={filters.role ?? ALL_VALUE}
              onValueChange={(value) =>
                setFilter('role', value === ALL_VALUE ? undefined : value)
              }
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All roles</SelectItem>
                {USER_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status ?? ALL_VALUE}
              onValueChange={(value) =>
                setFilter('status', value === ALL_VALUE ? undefined : value)
              }
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
                {USER_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.isVerified ?? ALL_VALUE}
              onValueChange={(value) =>
                setFilter('isVerified', value === ALL_VALUE ? undefined : value)
              }
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All users</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <CreateUserDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={refresh}
            trigger={
              <Button type="button" size="sm">
                <PlusIcon className="size-4" />
                Add user
              </Button>
            }
          />
        }
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      <DataTablePagination
        meta={list.meta}
        getPageHref={getPageHref}
        onLimitChange={setLimit}
      />
    </div>
  )
}

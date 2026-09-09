'use client'

import {
  DataTable,
  DataTablePagination,
  type TPaginationChangeEvent,
  type TTableChangeEvent,
} from '@/components/shared/table'
import { USER_DEFAULT_PAGE_SIZE, USER_PAGE_SIZE_OPTIONS } from '@/constant/user'
import { useAuth } from '@/providers/auth-provider'
import { type IMeta } from '@/types/response.types'
import { type IUser } from '@/types/user.types'
import { type TUserQueryParams } from '@/validation/user-query.validation'
import { useState } from 'react'
import { toast } from 'sonner'
import { PERMISSIONS } from '@/constant/permissions'
import { canActOnUser } from '@/lib/auth/permissions'
import { type TUserDialogState } from '../_lib/user-dialog'
import { buildQueryKey } from '../_lib/users-query'
import { useUsersParams } from '../_lib/users-params-context'
import { EditUserDialog } from './dialogs/edit-user-dialog'
import { UserDeleteDialog } from './dialogs/user-delete-dialog'
import { UserRoleDialog } from './dialogs/user-role-dialog'
import { UserStatusDialog } from './dialogs/user-status-dialog'
import { UserViewDialog } from './dialogs/user-view-dialog'
import { getUsersColumns } from './users-columns'
import { UsersSelectionBar } from './users-selection-bar'

interface UsersTableProps {
  users: IUser[]
  meta: IMeta
  params: TUserQueryParams
}

export function UsersTable({ users, meta, params }: UsersTableProps) {
  const { user: viewer } = useAuth()
  const { isPending, applyPatch, refresh } = useUsersParams()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialog, setDialog] = useState<TUserDialogState | null>(null)

  // Selection is page-scoped, so drop it whenever the query changes — keeping
  // ids from a page you can no longer see would make the bulk bar lie about
  // what it would act on. Derived during render (not in an effect) so it
  // never triggers a second pass.
  const queryKey = buildQueryKey(params)
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey)
  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey)
    setSelectedIds([])
  }

  const columns = getUsersColumns({
    viewer,
    onAction: (action, user) => setDialog({ action, user }),
  })

  const handleTableChange = (event: TTableChangeEvent) => {
    setSelectedIds(event.selectedIds)

    const sortChanged =
      event.sort.sortBy !== (params.sortBy ?? null) ||
      event.sort.sortOrder !== (params.sortOrder ?? null)

    if (sortChanged) {
      applyPatch({
        sortBy: event.sort.sortBy ?? undefined,
        sortOrder: event.sort.sortOrder ?? undefined,
        page: undefined,
      })
    }
  }

  const handlePaginationChange = (event: TPaginationChangeEvent) => {
    applyPatch({
      page: event.page === 1 ? undefined : event.page,
      limit:
        event.pageSize === USER_DEFAULT_PAGE_SIZE ? undefined : event.pageSize,
    })
  }

  const handleBulkAction = (actionId: string) => {
    toast.info(
      `Bulk ${actionId} for ${selectedIds.length} user(s) is not implemented yet.`
    )
  }

  const hasFilters = Boolean(
    params.searchTerm ?? params.role ?? params.status ?? params.isVerified
  )

  const closeDialog = () => setDialog(null)

  return (
    <>
      <DataTable
        columns={columns}
        rows={users}
        rowId={(user) => user.id}
        sort={{
          sortBy: params.sortBy ?? null,
          sortOrder: params.sortOrder ?? null,
        }}
        selectedIds={selectedIds}
        onChange={handleTableChange}
        // Only rows the viewer could actually act on are selectable — that
        // covers their own account and anyone at or above their own role, so
        // the bulk bar never counts rows a bulk action would be refused.
        isRowSelectable={(user) =>
          canActOnUser(viewer, user, PERMISSIONS.USERS_DELETE)
        }
        // The pending skeleton for query changes — the page is server-rendered
        // with real rows, so this is the only thing that ever shows skeletons.
        isLoading={isPending}
        skeletonRows={meta.limit}
        emptyTitle={hasFilters ? 'No matching users' : 'No data available'}
        emptyDescription={
          hasFilters
            ? 'Try adjusting your search or filters.'
            : 'Users will appear here once they are created.'
        }
      />

      <DataTablePagination
        page={meta.page}
        pageSize={meta.limit}
        total={meta.total}
        totalPages={meta.totalPage}
        onChange={handlePaginationChange}
        pageSizeOptions={USER_PAGE_SIZE_OPTIONS}
        disabled={isPending}
      />

      <UsersSelectionBar
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onBulkAction={handleBulkAction}
      />

      {dialog?.action === 'view' && (
        <UserViewDialog user={dialog.user} onClose={closeDialog} />
      )}
      {dialog?.action === 'edit' && (
        <EditUserDialog
          user={dialog.user}
          onClose={closeDialog}
          onSuccess={refresh}
        />
      )}
      {dialog?.action === 'role' && (
        <UserRoleDialog
          user={dialog.user}
          onClose={closeDialog}
          onSuccess={refresh}
        />
      )}
      {dialog?.action === 'status' && (
        <UserStatusDialog
          user={dialog.user}
          onClose={closeDialog}
          onSuccess={refresh}
        />
      )}
      {dialog?.action === 'delete-soft' && (
        <UserDeleteDialog
          user={dialog.user}
          mode="soft"
          onClose={closeDialog}
          onSuccess={refresh}
        />
      )}
      {dialog?.action === 'delete-hard' && (
        <UserDeleteDialog
          user={dialog.user}
          mode="hard"
          onClose={closeDialog}
          onSuccess={refresh}
        />
      )}
    </>
  )
}

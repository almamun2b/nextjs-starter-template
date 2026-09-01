'use client'

import {
  DataTableToolbar,
  type TFilterConfig,
  type TToolbarChangeEvent,
} from '@/components/shared/table'
import { Button } from '@/components/ui/button'
import {
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  USER_VERIFIED_OPTIONS,
} from '@/constant/user'
import { type TUserQueryParams } from '@/validation/user-query.validation'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useUsersParams } from '../_lib/users-params-context'
import { CreateUserDialog } from './dialogs/create-user-dialog'

const FILTER_CONFIGS: readonly TFilterConfig[] = [
  {
    name: 'role',
    allLabel: 'All roles',
    ariaLabel: 'Filter by role',
    options: USER_ROLE_OPTIONS,
  },
  {
    name: 'status',
    allLabel: 'All statuses',
    ariaLabel: 'Filter by status',
    options: USER_STATUS_OPTIONS,
  },
  {
    name: 'isVerified',
    allLabel: 'All users',
    ariaLabel: 'Filter by verification',
    options: USER_VERIFIED_OPTIONS,
  },
]

interface UsersToolbarProps {
  params: TUserQueryParams
}

/**
 * Rendered *outside* the page's Suspense boundary so it stays mounted across
 * every query change — which is what keeps search-input focus and avoids the
 * toolbar flickering while the table streams in.
 */
export function UsersToolbar({ params }: UsersToolbarProps) {
  const { isPending, applyPatch, refresh } = useUsersParams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleChange = (event: TToolbarChangeEvent) => {
    if (event.action?.type === 'refresh') {
      refresh()
      return
    }

    applyPatch({
      searchTerm: event.search || undefined,
      role: event.filters.role ?? undefined,
      status: event.filters.status ?? undefined,
      isVerified: event.filters.isVerified ?? undefined,
      // Any filter or search change invalidates the current page offset.
      page: undefined,
    })
  }

  return (
    <>
      <DataTableToolbar
        search={params.searchTerm ?? ''}
        filters={{
          role: params.role ?? null,
          status: params.status ?? null,
          isVerified: params.isVerified ?? null,
        }}
        filterConfigs={FILTER_CONFIGS}
        onChange={handleChange}
        isPending={isPending}
        searchPlaceholder="Search users..."
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="size-3.5" />
            Add user
          </Button>
        }
      />

      {isCreateOpen && (
        <CreateUserDialog
          onClose={() => setIsCreateOpen(false)}
          onSuccess={refresh}
        />
      )}
    </>
  )
}

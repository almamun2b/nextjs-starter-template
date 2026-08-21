'use client'

import { TableFilter } from '@/components/shared/table/table-filter'
import { TableToolbar } from '@/components/shared/table/table-toolbar'
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '@/constant/user'
import { useState } from 'react'

const USER_VERIFIED_OPTIONS = [
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
]

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{
    role?: string
    status?: string
    isVerified?: string
  }>({})
  const setFilter = (key: keyof typeof filters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <h1 className="mb-1 text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage user accounts, roles, and access.
        </p>
      </div>
      <div className="flex flex-col">
        <TableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search users..."
          filters={
            <div className="flex gap-2">
              <TableFilter
                value={filters.role}
                onChange={(v) => setFilter('role', v)}
                placeholder="Role"
                allLabel="All roles"
                options={USER_ROLE_OPTIONS}
                classNameTrigger="w-32"
              />

              <TableFilter
                value={filters.status}
                onChange={(v) => setFilter('status', v)}
                placeholder="Status"
                allLabel="All statuses"
                options={USER_STATUS_OPTIONS}
                classNameTrigger="w-32"
              />

              <TableFilter
                value={filters.isVerified}
                onChange={(v) => setFilter('isVerified', v)}
                placeholder="Verified"
                allLabel="All users"
                options={USER_VERIFIED_OPTIONS}
                classNameTrigger="w-32"
              />
            </div>
          }
        />
        <p>{searchTerm}</p>
      </div>
    </div>
  )
}

export default UsersPage

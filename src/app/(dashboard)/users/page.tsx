import { getAllUsers } from '@/app/actions/user'
import { UsersTable } from '@/components/modules/user/users-table'
import type { TUserQueryOptions, TUsersResponse } from '@/types/user.types'
import { Suspense } from 'react'

type TPageProps = {
  searchParams: Promise<Record<string, string | undefined>>
}

const UsersPage = async ({ searchParams }: TPageProps) => {
  const params = await searchParams

  const queryOptions: TUserQueryOptions = {
    page: params.page ? Number(params.page) : 1,
    limit: params.limit ? Number(params.limit) : 10,
    sortBy: params.sortBy ?? 'createdAt',
    sortOrder: (params.sortOrder as TUserQueryOptions['sortOrder']) ?? 'desc',
    searchTerm: params.searchTerm || undefined,
    role: params.role as TUserQueryOptions['role'],
    status: params.status as TUserQueryOptions['status'],
    isVerified:
      params.isVerified === 'true'
        ? true
        : params.isVerified === 'false'
          ? false
          : undefined,
  }

  let response: TUsersResponse | null = null
  let errorMessage: string | null = null

  try {
    response = await getAllUsers(queryOptions)
  } catch (error) {
    errorMessage =
      (error as Error).message ||
      'Failed to load users. Please try again later.'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage user accounts, roles, and access.
        </p>
      </div>
      {response ? (
        <Suspense fallback={null}>
          <UsersTable initialData={response} />
        </Suspense>
      ) : (
        <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default UsersPage

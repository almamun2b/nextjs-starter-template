import { getAllUsers } from '@/app/actions/user'
import { isFetchError } from '@/lib/error'
import { type IMeta } from '@/types/response.types'
import { type IUser } from '@/types/user.types'
import { type TUserQueryParams } from '@/validation/user-query.validation'
import { toUserQueryOptions } from '../_lib/users-query'
import { UsersTable } from './users-table'
import { UsersTableError } from './users-table-error'

interface UsersTableSectionProps {
  params: TUserQueryParams
}

type TUsersResult =
  | { ok: true; users: IUser[]; meta: IMeta }
  | { ok: false; title: string; message: string }

/** Turns a thrown fetch failure into something worth showing a human. */
function describeError(error: unknown): { title: string; message: string } {
  if (isFetchError(error)) {
    if (error.status === 401) {
      return {
        title: 'Session expired',
        message: 'Please sign in again to continue managing users.',
      }
    }
    if (error.status === 403) {
      return {
        title: 'Not authorised',
        message:
          'Your account does not have permission to view the user directory.',
      }
    }
    return { title: 'Could not load users', message: error.message }
  }

  return {
    title: 'Could not load users',
    message:
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while loading users.',
  }
}

/**
 * Kept free of JSX so the try/catch only ever wraps the request — building
 * elements inside a try/catch would not actually catch their render errors.
 */
async function loadUsers(params: TUserQueryParams): Promise<TUsersResult> {
  try {
    const response = await getAllUsers(toUserQueryOptions(params))
    return { ok: true, users: response.data, meta: response.meta }
  } catch (error) {
    return { ok: false, ...describeError(error) }
  }
}

/**
 * Async Server Component — the only place the users list is fetched.
 *
 * It is wrapped in a query-keyed `<Suspense>` by the page, so every sort,
 * filter, search and page change re-runs this on the server rather than
 * fetching from the browser.
 */
export async function UsersTableSection({ params }: UsersTableSectionProps) {
  const result = await loadUsers(params)

  if (!result.ok) {
    return <UsersTableError title={result.title} message={result.message} />
  }

  return <UsersTable users={result.users} meta={result.meta} params={params} />
}

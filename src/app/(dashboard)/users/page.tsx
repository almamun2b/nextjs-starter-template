import { userQuerySchema } from '@/validation/user-query.validation'
import { type Metadata } from 'next'
import { UsersTableSection } from './_components/users-table-section'
import { UsersToolbar } from './_components/users-toolbar'
import { UsersParamsProvider } from './_lib/users-params-context'

export const metadata: Metadata = {
  title: 'Users',
  description: 'Manage user accounts, roles, and access.',
}

type TUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const UsersPage = async ({ searchParams }: TUsersPageProps) => {
  // `.catch()` guards on every field mean a malformed or stale URL degrades to
  // defaults instead of throwing.
  const params = userQuerySchema.parse(await searchParams)

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage user accounts, roles, and access across your organisation.
        </p>
      </header>

      {/*
        No <Suspense> here on purpose. A Suspense boundary would stream the
        skeleton as the initial HTML and fill the rows in afterwards, so a hard
        reload would flash a pending state. Awaiting the data here instead means
        the first byte of HTML already contains the rendered table.

        The pending skeleton for *query changes* comes from the shared
        `isPending` transition below, not from streaming.
      */}
      <UsersParamsProvider>
        {/* `min-w-0` lets this shrink below the table's min-width so the table's
            own overflow-x container scrolls instead of widening the page. */}
        <div className="w-full min-w-0 overflow-hidden rounded-xl border bg-card">
          <UsersToolbar params={params} />
          <UsersTableSection params={params} />
        </div>
      </UsersParamsProvider>
    </div>
  )
}

export default UsersPage

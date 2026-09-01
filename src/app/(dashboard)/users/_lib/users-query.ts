import { type TTableColumnMeta } from '@/components/shared/table'
import { type TUserQueryOptions } from '@/types/user.types'
import { type TUserQueryParams } from '@/validation/user-query.validation'
import {
  toRoleParam,
  toStatusParam,
  type TUserRoleValue,
  type TUserStatusValue,
} from './user-enum'

/**
 * Column geometry, shared by the skeleton (Server Component) and the live
 * table (Client Component). Keys double as the API's `sortBy` field names.
 *
 * Exactly one column omits `width` so it absorbs the remaining space; every
 * other width is fixed, which is what keeps columns from resizing between the
 * skeleton, page 1 and page 2.
 */
const USERS_COLUMN_META: TTableColumnMeta[] = [
  { key: 'select', label: '', kind: 'select', width: '48px' },
  { key: 'email', label: 'User', sortable: true },
  { key: 'role', label: 'Role', sortable: true, width: '140px' },
  { key: 'status', label: 'Status', sortable: true, width: '140px' },
  { key: 'isVerified', label: 'Verified', sortable: true, width: '120px' },
  { key: 'lastLoginAt', label: 'Last login', sortable: true, width: '170px' },
  { key: 'createdAt', label: 'Joined', sortable: true, width: '150px' },
  { key: 'actions', label: '', kind: 'action', width: '72px', align: 'right' },
]

/** Maps validated URL params onto the shape `getAllUsers` expects. */
const toUserQueryOptions = (params: TUserQueryParams): TUserQueryOptions => ({
  page: params.page,
  limit: params.limit,
  sortBy: params.sortBy,
  sortOrder: params.sortOrder,
  searchTerm: params.searchTerm,
  role: params.role ? toRoleParam(params.role as TUserRoleValue) : undefined,
  status: params.status
    ? toStatusParam(params.status as TUserStatusValue)
    : undefined,
  isVerified:
    params.isVerified === undefined ? undefined : params.isVerified === 'true',
})

/**
 * Identity of the current query. Used as the `<Suspense>` key so that any
 * change remounts the boundary — which is what makes the server re-fetch and
 * the skeleton show on every sort/filter/page/search change.
 */
const buildQueryKey = (params: TUserQueryParams): string =>
  [
    params.page,
    params.limit,
    params.sortBy ?? '',
    params.sortOrder ?? '',
    params.searchTerm ?? '',
    params.role ?? '',
    params.status ?? '',
    params.isVerified ?? '',
  ].join('|')

export { buildQueryKey, toUserQueryOptions, USERS_COLUMN_META }

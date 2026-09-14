import {
  USER_DEFAULT_PAGE_SIZE,
  USER_PAGE_SIZE_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_SORTABLE_FIELDS,
  USER_STATUS_OPTIONS,
} from '@/constant/user'
import z from 'zod/v3'

const roleValues = USER_ROLE_OPTIONS.map((option) => option.value)
const statusValues = USER_STATUS_OPTIONS.map((option) => option.value)
const pageSizes: readonly number[] = USER_PAGE_SIZE_OPTIONS

/**
 * Parses the `/users` query string.
 *
 * Every field is `.catch()`-guarded so a hand-edited, stale, or bookmarked URL
 * degrades to sane defaults instead of throwing a 500 at the page.
 */
const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  limit: z.coerce
    .number()
    .int()
    .refine((value) => pageSizes.includes(value))
    .catch(USER_DEFAULT_PAGE_SIZE),
  sortBy: z.enum(USER_SORTABLE_FIELDS).optional().catch(undefined),
  sortOrder: z.enum(['asc', 'desc']).optional().catch(undefined),
  searchTerm: z.string().trim().min(1).max(200).optional().catch(undefined),
  role: z
    .enum(roleValues as [string, ...string[]])
    .optional()
    .catch(undefined),
  status: z
    .enum(statusValues as [string, ...string[]])
    .optional()
    .catch(undefined),
  isVerified: z.enum(['true', 'false']).optional().catch(undefined),
})

type TUserQueryParams = z.infer<typeof userQuerySchema>

export { userQuerySchema }
export type { TUserQueryParams }

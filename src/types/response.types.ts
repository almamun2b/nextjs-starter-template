interface IMeta {
  limit: number
  page: number
  total: number
  totalPage: number
}

type SortOrder = 'asc' | 'desc'

type CursorDirection = 'forward' | 'backward'

interface IMetaCursor {
  limit: number
  nextCursor: string | null
  prevCursor: string | null
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface IErrors {
  field: string | null
  message: string | null
}

interface IResponseBase {
  statusCode: number
  message: string
  timestamp: string
  path: string
}

/**
 * `success` is a literal on both envelopes, so `if (result.success)` narrows
 * a Server Action's `T | IErrorResponse` result to the right branch.
 */
interface IResponse extends IResponseBase {
  success: true
}

interface IErrorResponse extends IResponseBase {
  success: false
  errors: IErrors[] | null
  code: string
}

export type {
  CursorDirection,
  IErrorResponse,
  IErrors,
  IMeta,
  IMetaCursor,
  IResponse,
  SortOrder,
}

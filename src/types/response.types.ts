interface IMeta {
  limit: number
  page: number
  total: number
  totalPage: number
}

type SortOrder = 'asc' | 'desc'

type CursorSortDirection = 'forward' | 'backward'

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

interface IResponse {
  statusCode: number
  success: boolean
  message: string
  timestamp: string
  path: string
}

interface IErrorResponse extends IResponse {
  errors: IErrors[] | null
  code: string
  data?: null
}

export type {
  CursorSortDirection,
  IErrorResponse,
  IMeta,
  IMetaCursor,
  IResponse,
  SortOrder,
}

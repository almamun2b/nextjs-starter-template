interface Meta {
  page: number
  limit: number
  total: number
  totalPage: number
}

interface SuccessResponse {
  success: boolean
  message: string
}

export type { Meta, SuccessResponse }

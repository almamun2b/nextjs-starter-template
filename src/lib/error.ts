import type { IErrorResponse } from '@/types/response.types'
import { FetchError } from './fetch'

const isFetchError = (err: unknown): err is FetchError<IErrorResponse> => {
  return err instanceof FetchError
}

const handleFetchError = (error: unknown): IErrorResponse => {
  if (isFetchError(error) && error.data) {
    return error.data
  }
  throw error
}

export { handleFetchError, isFetchError }

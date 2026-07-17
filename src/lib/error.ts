import type { IErrorResponse } from '@/types/response.types'
import { FetchError } from './fetch'

const isErrorResponse = (err: unknown): err is FetchError<IErrorResponse> => {
  return err instanceof FetchError
}

const handleFetchError = (error: unknown): IErrorResponse => {
  if (isErrorResponse(error) && error.data) {
    return error.data as IErrorResponse
  }
  throw error
}

export { handleFetchError, isErrorResponse }

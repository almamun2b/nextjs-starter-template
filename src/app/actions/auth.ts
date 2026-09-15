'use server'

import { CACHE_TAGS } from '@/constant/tags'
import { $fetch } from '@/lib/$fetch'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/cookies'
import { handleFetchError } from '@/lib/error'
import {
  TForgotPasswordInput,
  TLoginInput,
  TRegisterForm,
  TResendVerificationCodeInput,
  TResetPasswordInput,
  TVerifyEmailInput,
} from '@/types/auth.types'
import type { IErrorResponse, IResponse } from '@/types/response.types'
import type { TUserResponse } from '@/types/user.types'
import { updateTag } from 'next/cache'
import { cookies } from 'next/headers'

const loginUser = async (
  data: TLoginInput
): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<TUserResponse, TLoginInput>(
      '/auth/login',
      { body: data }
    )
    updateTag(CACHE_TAGS.PROFILE)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const registerUser = async (
  data: TRegisterForm
): Promise<IResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<IResponse, TRegisterForm>(
      '/auth/register',
      { body: data }
    )
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const resendVerificationCode = async (
  data: TResendVerificationCodeInput
): Promise<IResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<
      IResponse,
      TResendVerificationCodeInput
    >('/auth/resend-verification-code', { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const verifyEmail = async (
  data: TVerifyEmailInput
): Promise<IResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<IResponse, TVerifyEmailInput>(
      '/auth/verify-email',
      { body: data }
    )
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const refreshToken = async (): Promise<IResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<IResponse>(
      '/auth/refresh-token'
    )
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

/**
 * Always ends the session locally: if the backend call fails (expired token,
 * outage), the auth cookies are still cleared so the user is not left
 * half-signed-in. The result only tells the UI whether the backend agreed.
 */
const logoutUser = async (): Promise<IResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<IResponse>('/auth/logout')
    return response
  } catch (error) {
    return handleFetchError(error)
  } finally {
    const cookieStore = await cookies()
    cookieStore.delete(ACCESS_TOKEN_COOKIE)
    cookieStore.delete(REFRESH_TOKEN_COOKIE)
    updateTag(CACHE_TAGS.PROFILE)
  }
}

const forgotPassword = async (
  data: TForgotPasswordInput
): Promise<IResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<
      IResponse,
      TForgotPasswordInput
    >('/auth/forgot-password', { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const resendForgotPassword = async (
  data: TForgotPasswordInput
): Promise<IResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<
      IResponse,
      TForgotPasswordInput
    >('/auth/resend-forgot-password', { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const resetPassword = async (
  data: TResetPasswordInput
): Promise<IResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<
      IResponse,
      TResetPasswordInput
    >('/auth/reset-password', { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

export {
  forgotPassword,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  resendForgotPassword,
  resendVerificationCode,
  resetPassword,
  verifyEmail,
}

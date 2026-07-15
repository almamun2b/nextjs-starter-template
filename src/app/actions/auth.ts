'use server'

import { CACHE_TAGS } from '@/constant/tags'
import { $fetch } from '@/lib/$fetch'
import {
  TForgotPasswordInput,
  TLoginInput,
  TRegisterForm,
  TResendVerificationCodeInput,
  TResetPasswordInput,
  TVerifyEmailInput,
} from '@/types/auth.types'
import { IResponse } from '@/types/response.types'
import { TUserResponse } from '@/types/user.types'
import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

const loginUser = async (data: TLoginInput) => {
  try {
    const { data: response } = await $fetch.post<TUserResponse, TLoginInput>(
      '/auth/login',
      { body: data }
    )

    revalidateTag(CACHE_TAGS.PROFILE, 'max')
    return response
  } catch (error) {
    throw error
  }
}

const registerUser = async (data: TRegisterForm) => {
  try {
    const { data: response } = await $fetch.post<IResponse, TRegisterForm>(
      '/auth/register',
      { body: data }
    )

    return response
  } catch (error) {
    throw error
  } finally {
    redirect('/')
  }
}

const resendVerificationCode = async (data: TResendVerificationCodeInput) => {
  try {
    const { data: response } = await $fetch.post<
      IResponse,
      TResendVerificationCodeInput
    >('/auth/resend-verification-code', { body: data })

    return response
  } catch (error) {
    throw error
  }
}

const verifyEmail = async (data: TVerifyEmailInput) => {
  try {
    const { data: response } = await $fetch.post<IResponse, TVerifyEmailInput>(
      '/auth/verify-email',
      { body: data }
    )

    return response
  } catch (error) {
    throw error
  }
}

const refreshToken = async () => {
  try {
    const { data: response } = await $fetch.post<IResponse>(
      '/auth/refresh-token'
    )

    return response
  } catch (error) {
    throw error
  }
}

const logoutUser = async () => {
  try {
    const { data: response } = await $fetch.post<IResponse>('/auth/logout')

    return response
  } catch (error) {
    throw error
  }
}

const forgotPassword = async (data: TForgotPasswordInput) => {
  try {
    const { data: response } = await $fetch.post<IResponse>(
      '/auth/forgot-password',
      { body: data }
    )

    return response
  } catch (error) {
    throw error
  }
}

const resendForgotPassword = async (data: TForgotPasswordInput) => {
  try {
    const { data: response } = await $fetch.post<IResponse>(
      '/auth/resend-forgot-password',
      { body: data }
    )

    return response
  } catch (error) {
    throw error
  }
}

const resetPassword = async (data: TResetPasswordInput) => {
  try {
    const { data: response } = await $fetch.post<IResponse>(
      '/auth/reset-password',
      { body: data }
    )

    return response
  } catch (error) {
    throw error
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

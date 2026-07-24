import {
  loginFormSchema,
  profileFormSchema,
  registerFormSchema,
} from '@/validation/auth.validation'
import z from 'zod/v3'

type TLoginInput = z.infer<typeof loginFormSchema>

type TRegisterForm = z.infer<typeof registerFormSchema>

type TProfileFormInput = z.infer<typeof profileFormSchema>

type TResendVerificationCodeInput = {
  email: string
}

type TVerifyEmailInput = {
  email: string
  code: string
}

type TForgotPasswordInput = {
  email: string
}

type TResetPasswordInput = {
  token: string
  newPassword: string
}

export type {
  TForgotPasswordInput,
  TLoginInput,
  TProfileFormInput,
  TRegisterForm,
  TResendVerificationCodeInput,
  TResetPasswordInput,
  TVerifyEmailInput,
}

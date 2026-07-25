import {
  forgotPasswordSchema,
  loginFormSchema,
  profileFormSchema,
  registerFormSchema,
  resetPasswordSchema,
} from '@/validation/auth.validation'
import z from 'zod/v3'

type TForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

type TResetPasswordForm = z.infer<typeof resetPasswordSchema>

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
  TForgotPasswordForm,
  TForgotPasswordInput,
  TLoginInput,
  TProfileFormInput,
  TRegisterForm,
  TResendVerificationCodeInput,
  TResetPasswordForm,
  TResetPasswordInput,
  TVerifyEmailInput,
}

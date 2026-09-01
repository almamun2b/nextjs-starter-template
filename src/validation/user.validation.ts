import { UserRole, UserStatus } from '@/types/enum.types'
import {
  emailSchema,
  genderEnum,
  passwordSchema,
} from '@/validation/auth.validation'
import z from 'zod/v3'

const changePasswordSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const createUserSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm the password' }),
    username: z
      .string()
      .min(3, { message: 'Username must be at least 3 characters' })
      .max(30, { message: 'Username must be under 30 characters' })
      .trim()
      .optional()
      .or(z.literal('')),
    firstName: z
      .string()
      .max(50, { message: 'First name must be under 50 characters' })
      .trim()
      .optional()
      .or(z.literal('')),
    lastName: z
      .string()
      .max(50, { message: 'Last name must be under 50 characters' })
      .trim()
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .max(20, { message: 'Phone number must be under 20 characters' })
      .trim()
      .optional()
      .or(z.literal('')),
    gender: z.union([z.literal(''), genderEnum]).optional(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export { changePasswordSchema, createUserSchema }

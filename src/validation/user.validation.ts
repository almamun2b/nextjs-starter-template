import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '@/constant/user'
import {
  emailSchema,
  genderEnum,
  passwordSchema,
} from '@/validation/auth.validation'
import z from 'zod/v3'

const changePasswordSchema = z
  .object({
    // Deliberately NOT `passwordSchema` — that enforces the *current* policy,
    // but a user's existing password may predate it. Requiring it here would
    // permanently lock such a user out of ever changing their password.
    oldPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  })

// The API exchanges roles/statuses as their string keys, so these validate the
// string values from `USER_ROLE_OPTIONS`/`USER_STATUS_OPTIONS` rather than the
// numeric `UserRole`/`UserStatus` enums those names are typed against.
const roleEnum = z.enum(
  USER_ROLE_OPTIONS.map((option) => option.value) as [string, ...string[]]
)
const statusEnum = z.enum(
  USER_STATUS_OPTIONS.map((option) => option.value) as [string, ...string[]]
)

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
    role: z.union([z.literal(''), roleEnum]).optional(),
    status: z.union([z.literal(''), statusEnum]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const updateUserRoleSchema = z.object({
  role: roleEnum,
})

const updateUserStatusSchema = z.object({
  status: statusEnum,
})

type TCreateUserForm = z.infer<typeof createUserSchema>
type TUpdateUserRoleForm = z.infer<typeof updateUserRoleSchema>
type TUpdateUserStatusForm = z.infer<typeof updateUserStatusSchema>

export {
  changePasswordSchema,
  createUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
}
export type { TCreateUserForm, TUpdateUserRoleForm, TUpdateUserStatusForm }

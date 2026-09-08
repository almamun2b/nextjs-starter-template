import z from 'zod/v3'

const createNameSchema = (label: string) =>
  z
    .string()
    .min(1, { message: `${label} is required` })
    .max(50, { message: `${label} must be under 50 characters` })
    .trim()

const emailSchema = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Invalid email address' })
  .trim()
  .toLowerCase()

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

type TPasswordRuleId =
  | 'length'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'special'

interface IPasswordRule {
  id: TPasswordRuleId
  /** Short imperative text for the strength checklist. */
  label: string
  /** Sentence shown as the validation error. */
  message: string
  test: (value: string) => boolean
}

/**
 * Single source of truth for password policy.
 *
 * `passwordSchema` below is built from this, and the strength meter renders
 * from it — so the rules, their error messages and the checklist can't drift.
 */
const PASSWORD_RULES: readonly IPasswordRule[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    message: 'Password must contain at least one uppercase letter',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    message: 'Password must contain at least one lowercase letter',
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: 'number',
    label: 'One number',
    message: 'Password must contain at least one number',
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: 'special',
    label: 'One special character',
    message: 'Password must contain at least one special character',
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
] as const

// `superRefine` (rather than chained `.refine`s) keeps zod reporting *every*
// unmet rule at once, which is what drives FieldError's multi-error list.
const passwordSchema = z
  .string()
  .min(1, { message: 'Password is required' })
  .max(PASSWORD_MAX_LENGTH, {
    message: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`,
  })
  .superRefine((value, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.test(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.message })
      }
    }
  })

const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

const registerFormSchema = z
  .object({
    firstName: createNameSchema('First name'),
    lastName: createNameSchema('Last name'),
    email: emailSchema,
    password: passwordSchema,

    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const forgotPasswordSchema = z.object({
  email: emailSchema,
})

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: 'Token is required' }),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Verification code must be 6 digits' })
    .regex(/^\d{6}$/, { message: 'Verification code must be numeric' }),
})

const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])

const profileFormSchema = z.object({
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
  bio: z
    .string()
    .max(500, { message: 'Bio must be under 500 characters' })
    .trim()
    .optional()
    .or(z.literal('')),
  gender: z.union([z.literal(''), genderEnum]).optional(),
  address: z
    .string()
    .max(200, { message: 'Address must be under 200 characters' })
    .trim()
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  timezone: z
    .string()
    .max(50, { message: 'Timezone must be under 50 characters' })
    .trim()
    .optional()
    .or(z.literal('')),
  locale: z
    .string()
    .max(10, { message: 'Locale must be under 10 characters' })
    .trim()
    .optional()
    .or(z.literal('')),
})

export {
  emailSchema,
  forgotPasswordSchema,
  genderEnum,
  loginFormSchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
  passwordSchema,
  profileFormSchema,
  registerFormSchema,
  resetPasswordSchema,
  verifyEmailSchema,
}
export type { IPasswordRule, TPasswordRuleId }

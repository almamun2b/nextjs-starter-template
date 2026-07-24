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

const passwordSchema = z
  .string()
  .min(1, { message: 'Password is required' })
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, {
    message: 'Password must not exceed 128 characters',
  })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, {
    message: 'Password must contain at least one special character',
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
  genderEnum,
  loginFormSchema,
  profileFormSchema,
  registerFormSchema,
  verifyEmailSchema,
}

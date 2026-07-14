import z from 'zod/v3'

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' })
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(8, { message: 'Password must be at least 6 characters long' })
    .max(128, { message: 'Password must not exceed 128 characters' }),
})

const registerFormSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: 'First name is required' })
      .max(50, { message: 'First name must be under 50 characters' })
      .trim(),

    lastName: z
      .string()
      .min(1, { message: 'Last Name is required' })
      .max(50, { message: 'Last Name must be under 50 characters' })
      .trim(),

    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email({ message: 'Invalid email address' })
      .trim()
      .toLowerCase(),

    password: z
      .string()
      .min(1, { message: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(100, { message: 'Password is too long' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[^A-Za-z0-9]/, {
        message: 'Password must contain at least one special character',
      }),

    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export { loginFormSchema, registerFormSchema }

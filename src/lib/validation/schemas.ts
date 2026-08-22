import { z } from 'zod'

/* ------------------------------------------------------------------
   Every request body is parsed through one of these before a handler
   sees it. Nothing reaches the database untyped.
   ------------------------------------------------------------------ */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Enter a valid email address.')
  .max(254, 'That email address is too long.')
  .email('Enter a valid email address.')

/**
 * Length is the control that actually matters; the character-class rules
 * mirror the meter the signup screen already shows, so the client and the
 * server agree on what "strong enough" means.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(1024, 'That password is too long.')
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v), 'Mix upper and lower case.')
  .refine((v) => /\d/.test(v), 'Include at least one number.')

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Enter your name.')
  .max(80, 'Keep your name under 80 characters.')

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  org: z.string().trim().max(120).optional().or(z.literal('')),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(1024),
  remember: z.boolean().optional().default(true),
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'That reset link is not valid.').max(200),
  password: passwordSchema,
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(1024),
    newPassword: passwordSchema,
    /** Ends every other session. Default on — a password change usually means "I think I was compromised". */
    signOutOthers: z.boolean().optional().default(true),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'Choose a password you have not used here before.',
    path: ['newPassword'],
  })

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    org: z.string().trim().max(120).optional(),
    role: z.string().trim().max(80).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'Nothing to update.',
  })

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/** Flattens Zod issues into the `{ field: message }` shape the forms render. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.') || 'form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

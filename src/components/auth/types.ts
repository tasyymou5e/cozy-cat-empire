import { z } from 'zod';

export type AuthMode = 'login' | 'signup' | 'forgot-password' | 'update-password';

export const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const signupSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  displayName: z
    .string()
    .trim()
    .min(3, { message: 'Display name must be at least 3 characters' })
    .max(30, { message: 'Display name must be 30 characters or less' })
    .regex(/^[a-zA-Z0-9\s_-]+$/, {
      message: 'Only letters, numbers, spaces, underscores, and hyphens allowed',
    }),
  username: z
    .string()
    .trim()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username must be 20 characters or less' })
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
      message: 'Username must start with a letter and contain only letters, numbers, and underscores',
    }),
});

export const emailSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
});

export const passwordUpdateSchema = z
  .object({
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const AVATAR_OPTIONS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱'];

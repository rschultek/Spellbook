import { z } from "zod";

/**
 * Email validation schema
 * Validates email format
 */
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required");

/**
 * Password validation schema
 * Minimum 6 characters (Supabase default)
 */
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .min(1, "Password is required");

/**
 * Registration validation schema
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Password reset request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

/**
 * New password schema
 */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

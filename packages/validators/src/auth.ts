import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const emailSchema = z.string().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export const otpSchema = z
  .string()
  .length(6, "OTP must be 6 digits")
  .regex(/^\d+$/, "OTP must contain only digits");

export const loginWithPhoneSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const loginWithEmailSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerWithEmailSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginWithPhoneInput = z.infer<typeof loginWithPhoneSchema>;
export type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;
export type RegisterWithEmailInput = z.infer<typeof registerWithEmailSchema>;

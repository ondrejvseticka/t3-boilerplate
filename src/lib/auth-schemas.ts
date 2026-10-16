import { z } from "zod";

export const COMMON_WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "admin123",
  "welcome1",
  "letmein1",
  "changeme",
  "iloveyou",
  "epoch123",
  "testing1",
  "master123",
]);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password cannot exceed 128 characters")
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter (A-Z)",
  })
  .refine((val) => /[a-z]/.test(val), {
    message: "Password must contain at least one lowercase letter (a-z)",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Password must contain at least one number (0-9)",
  })
  .refine((val) => /[^A-Za-z0-9]/.test(val), {
    message: "Password must contain at least one symbol (!@#$%^&*)",
  })
  .refine((val) => !COMMON_WEAK_PASSWORDS.has(val.toLowerCase()), {
    message: "This password is too common and insecure. Choose a stronger one.",
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Work email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberDevice: z.boolean(),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name cannot exceed 50 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Work email is required")
    .email("Please enter a valid email address"),
  password: passwordSchema,
  agreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms of Service to continue",
  }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Work email is required")
    .email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface PasswordCriteria {
  label: string;
  met: boolean;
}

export function evaluatePassword(password: string): {
  criteria: PasswordCriteria[];
  score: number; // 0 to 4
  strengthLabel: "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
} {
  const criteria: PasswordCriteria[] = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "Number (0-9)", met: /[0-9]/.test(password) },
    { label: "Special symbol (!@#$)", met: /[^A-Za-z0-9]/.test(password) },
    {
      label: "Not easily guessable",
      met: password.length > 0 && !COMMON_WEAK_PASSWORDS.has(password.toLowerCase()),
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  if (metCount <= 2) {
    return {
      criteria,
      score: 1,
      strengthLabel: "Weak",
      colorClass: "bg-rose-500",
    };
  }
  if (metCount <= 4) {
    return {
      criteria,
      score: 2,
      strengthLabel: "Fair",
      colorClass: "bg-amber-500",
    };
  }
  if (metCount === 5) {
    return {
      criteria,
      score: 3,
      strengthLabel: "Good",
      colorClass: "bg-blue-500",
    };
  }
  return {
    criteria,
    score: 4,
    strengthLabel: "Strong",
    colorClass: "bg-emerald-500",
  };
}

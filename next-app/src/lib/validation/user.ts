import { z } from "zod";
import { passwordSchema } from "./auth";

export const createUserSchema = z.object({
  username: z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores."),
  displayName: z.string().trim().min(2).max(120),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional(),
  phone: z.string().trim().max(30).optional(),
  password: passwordSchema,
  roleId: z.string().uuid(),
  maxDevices: z.coerce.number().int().min(1).max(10),
  expiresAt: z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional()),
});

export const updateUserSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().trim().min(2).max(120),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional(),
  phone: z.string().trim().max(30).optional(),
  roleId: z.string().uuid(),
  maxDevices: z.coerce.number().int().min(1).max(10),
  expiresAt: z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional()),
  newPassword: z.union([z.literal(""), passwordSchema]).optional(),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "The new passwords do not match." })
  .refine((value) => value.newPassword !== value.currentPassword, { path: ["newPassword"], message: "Choose a password different from the current one." });

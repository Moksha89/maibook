import { z } from "zod";
import { nameField, optionalEmail, optionalPhone } from "./common";
import { passwordSchema } from "./auth";

export const createUserSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters.").max(80, "Username is too long.").regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores."),
  displayName: nameField("Display name"),
  email: optionalEmail,
  phone: optionalPhone,
  password: passwordSchema,
  roleId: z.string().uuid(),
  maxDevices: z.coerce.number().int("Device limit must be a whole number.").min(1, "Device limit must be between 1 and 10.").max(10, "Device limit must be between 1 and 10."),
  expiresAt: z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional()),
});

export const updateUserSchema = z.object({
  userId: z.string().uuid(),
  displayName: nameField("Display name"),
  email: optionalEmail,
  phone: optionalPhone,
  roleId: z.string().uuid(),
  maxDevices: z.coerce.number().int("Device limit must be a whole number.").min(1, "Device limit must be between 1 and 10.").max(10, "Device limit must be between 1 and 10."),
  expiresAt: z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional()),
  newPassword: z.union([z.literal(""), passwordSchema]).optional(),
});

export const profileSchema = z.object({
  displayName: nameField("Display name"),
  email: optionalEmail,
  phone: optionalPhone,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "The new passwords do not match." })
  .refine((value) => value.newPassword !== value.currentPassword, { path: ["newPassword"], message: "Choose a password different from the current one." });

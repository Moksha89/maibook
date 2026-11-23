import { z } from "zod";

export const uplineSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  percentageRate: z.coerce.number().min(0).max(100),
});

export const manualUplineEntrySchema = z.object({
  companyId: z.string().uuid(),
  uplineId: z.string().uuid(),
  amount: z.coerce.number().finite().refine((value) => value !== 0, "Amount cannot be zero."),
  entryDate: z.coerce.date(),
  remarks: z.string().trim().max(500).optional(),
});

export const shareholderSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  percentage: z.coerce.number().positive().max(100),
  phone: z.string().trim().max(30).optional(),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional(),
});

export const profitDistributionSchema = z.object({
  companyId: z.string().uuid(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  idempotencyKey: z.string().uuid(),
}).refine((value) => value.periodStart <= value.periodEnd, { path: ["periodEnd"], message: "End date must follow start date." });

export const uplineGroupSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  uplineIds: z.array(z.string().uuid()).min(1),
  percentages: z.array(z.coerce.number().positive().max(100)).min(1),
}).refine((value) => value.uplineIds.length === value.percentages.length, "Every member requires a percentage.").refine((value) => value.percentages.reduce((sum, percentage) => sum + percentage, 0) <= 100, "Group percentages cannot exceed 100 percent.");

import { z } from "zod";
import { money, nameField, optionalEmail, optionalPhone, pastOrToday, percent, SUM_TOLERANCE } from "./common";

export const uplineSchema = z.object({
  companyId: z.string().uuid(),
  name: nameField(),
  percentageRate: percent("Percentage rate"),
});

export const manualUplineEntrySchema = z.object({
  companyId: z.string().uuid(),
  uplineId: z.string().uuid(),
  amount: money("Amount", { nonZero: true }),
  entryDate: pastOrToday("Entry date"),
  remarks: z.string().trim().max(500).optional(),
});

export const shareholderSchema = z.object({
  companyId: z.string().uuid(),
  name: nameField(),
  percentage: percent("Percentage", { positive: true }),
  phone: optionalPhone,
  email: optionalEmail,
});

export const profitDistributionSchema = z.object({
  companyId: z.string().uuid(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  idempotencyKey: z.string().uuid(),
}).refine((value) => value.periodStart <= value.periodEnd, { path: ["periodEnd"], message: "The end date cannot be before the start date." });

export const uplineGroupSchema = z.object({
  companyId: z.string().uuid(),
  name: nameField(),
  uplineIds: z.array(z.string().uuid()).min(1, "Pick at least one upline."),
  percentages: z.array(percent("Member percentage", { positive: true })).min(1, "Pick at least one upline."),
}).refine((value) => value.uplineIds.length === value.percentages.length, "Every member requires a percentage.").refine((value) => Math.abs(value.percentages.reduce((sum, percentage) => sum + percentage, 0) - 100) <= SUM_TOLERANCE, "Member percentages must add up to exactly 100%.");

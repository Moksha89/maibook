import { z } from "zod";
import { money, upperName, optionalEmail, optionalPhone, pastOrToday, percent, SUM_TOLERANCE } from "./common";

export const uplineSchema = z.object({
  companyId: z.string().uuid(),
  name: upperName(),
  percentageRate: percent("Percentage rate"),
});

export const manualUplineEntrySchema = z.object({
  companyId: z.string().uuid(),
  uplineId: z.string().uuid(),
  amount: money("Amount", { nonZero: true }),
  entryDate: pastOrToday("Entry date"),
  remarks: z.string().trim().max(500).transform((value) => value.toUpperCase()).optional(),
});

export const shareholderSchema = z.object({
  companyId: z.string().uuid(),
  name: upperName(),
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
  name: upperName(),
  uplineIds: z.array(z.string().uuid()),
  percentages: z.array(percent("Member percentage", { positive: true })),
}).refine((value) => value.uplineIds.length === value.percentages.length, "Every member requires a percentage.").refine((value) => !value.percentages.length || Math.abs(value.percentages.reduce((sum, percentage) => sum + percentage, 0) - 100) <= SUM_TOLERANCE, "Member percentages must add up to exactly 100%.");

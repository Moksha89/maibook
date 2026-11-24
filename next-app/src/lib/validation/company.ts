import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(30).optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  defaultRate: z.union([z.literal(""), z.coerce.number().nonnegative().max(1_000_000)]).optional(),
});

export const updateCompanySchema = companySchema.extend({
  companyId: z.string().uuid(),
  reportHeader: z.string().trim().max(240).optional(),
  reportFooter: z.string().trim().max(240).optional(),
});

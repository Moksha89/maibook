import { z } from "zod";
import { upperName, optionalEmail, optionalPhone, pastOrToday } from "./common";

export const companySchema = z.object({
  name: upperName("Company name"),
  code: z.string().trim().max(30).regex(/^[A-Za-z0-9._-]*$/, "Code can use letters, numbers, dots, dashes and underscores only.").optional(),
  currency: z.preprocess((value) => (value === undefined || value === "" ? "INR" : value), z.string().trim().length(3, "Currency must be a 3-letter code, like INR.").regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code, like INR.").transform((value) => value.toUpperCase())),
  contactPhone: optionalPhone,
  contactEmail: optionalEmail,
  notes: z.string().trim().max(2000).optional(),
  defaultRate: z.union([z.literal(""), z.coerce.number().nonnegative("Rate cannot be negative.").max(1_000_000, "Rate is too large.")]).optional(),
});

export const updateCompanySchema = companySchema.extend({
  companyId: z.string().uuid(),
  reportHeader: z.string().trim().max(240).optional(),
  reportFooter: z.string().trim().max(240).optional(),
  createdAt: pastOrToday("Created date").optional(),
});

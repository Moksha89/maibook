import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(2_000).optional(),
});

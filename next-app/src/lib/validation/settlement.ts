import { z } from "zod";

export const settlementSchema = z.object({
  companyId: z.string().uuid(),
  identifierId: z.string().uuid(),
  uplineId: z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional()),
  amount: z.coerce.number().finite().refine((value) => value !== 0, "Amount cannot be zero."),
  settlementDate: z.coerce.date(),
  remarks: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().uuid(),
});

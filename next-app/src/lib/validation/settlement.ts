import { z } from "zod";
import { money, pastOrToday } from "./common";

export const settlementSchema = z.object({
  companyId: z.string().uuid(),
  identifierId: z.string().uuid(),
  uplineId: z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional()),
  amount: money("Amount", { nonZero: true }),
  settlementDate: pastOrToday("Settlement date"),
  remarks: z.string().trim().max(500).transform((value) => value.toUpperCase()).optional(),
  idempotencyKey: z.string().uuid(),
});

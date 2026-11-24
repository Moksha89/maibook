import { z } from "zod";

export const identifierSchema = z.object({
  companyId: z.string().uuid(),
  agentId: z.string().uuid(),
  value: z.string().trim().min(1).max(120),
  type: z.enum(["AGENT", "SUB_AGENT"]),
  percentageRate: z.coerce.number().min(0).max(100),
});

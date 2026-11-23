import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional(),
  companyId: z.string().uuid(),
  openingBalance: z.coerce.number().finite().max(1_000_000_000).min(-1_000_000_000),
});

export const assignAgentSchema = z.object({
  agentId: z.string().uuid(),
  companyId: z.string().uuid(),
  openingBalance: z.coerce.number().finite().max(1_000_000_000).min(-1_000_000_000),
});

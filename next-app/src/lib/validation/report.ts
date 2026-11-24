import { z } from "zod";

export const reportRequestSchema = z.object({
  templateId: z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional()),
  companyId: z.string().uuid(),
  agentId: z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional()),
  type: z.enum(["COMPANY_LEDGER", "AGENT_LEDGER", "SETTLEMENT", "PROFIT_DISTRIBUTION", "UPLINE", "COMPANY_SUMMARY", "COMPANY_PNL"]),
  format: z.enum(["PDF", "PNG", "CSV", "TEXT", "PRINT"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((value) => value.startDate <= value.endDate, { path: ["endDate"], message: "End date must follow start date." }).refine((value) => value.type !== "AGENT_LEDGER" || value.agentId, { path: ["agentId"], message: "Select an agent for an agent ledger report." });

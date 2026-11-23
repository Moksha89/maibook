import { z } from "zod";

export const agentTransferSchema = z.object({
  companyId: z.string().uuid(),
  senderAgentId: z.string().uuid(),
  receiverAgentId: z.string().uuid(),
  coins: z.coerce.number().positive().max(1_000_000_000),
  rate: z.coerce.number().nonnegative().max(1_000_000),
  entryDate: z.coerce.date(),
  remarks: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().uuid(),
}).refine((data) => data.senderAgentId !== data.receiverAgentId, { message: "Sender and receiver must be different.", path: ["receiverAgentId"] });

export const editAgentTransferSchema = z.object({
  entryId: z.string().uuid(),
  companyId: z.string().uuid(),
  coins: z.coerce.number().positive().max(1_000_000_000),
  rate: z.coerce.number().nonnegative().max(1_000_000),
  entryDate: z.coerce.date(),
  remarks: z.string().trim().max(500).optional(),
});

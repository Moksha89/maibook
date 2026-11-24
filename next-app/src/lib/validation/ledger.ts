import { z } from "zod";
import { money, pastOrToday } from "./common";

export const agentTransferSchema = z.object({
  companyId: z.string().uuid(),
  senderAgentId: z.string().uuid(),
  receiverAgentId: z.string().uuid(),
  coins: money("Coins", { positive: true }),
  rate: z.coerce.number({ error: "Rate must be a number." }).finite().nonnegative("Rate cannot be negative.").max(1_000_000, "Rate is too large.").refine((v) => Math.abs(Math.round(v * 10000) - v * 10000) < 1e-6, "Rate can have at most four decimal places."),
  entryDate: pastOrToday("Entry date"),
  remarks: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().uuid(),
}).refine((data) => data.senderAgentId !== data.receiverAgentId, { message: "Sender and receiver must be different.", path: ["receiverAgentId"] });

export const editAgentTransferSchema = z.object({
  entryId: z.string().uuid(),
  companyId: z.string().uuid(),
  coins: money("Coins", { positive: true }),
  rate: z.coerce.number({ error: "Rate must be a number." }).finite().nonnegative("Rate cannot be negative.").max(1_000_000, "Rate is too large.").refine((v) => Math.abs(Math.round(v * 10000) - v * 10000) < 1e-6, "Rate can have at most four decimal places."),
  entryDate: pastOrToday("Entry date"),
  remarks: z.string().trim().max(500).optional(),
});

export const editManualAgentSchema = z.object({
  entryId: z.string().uuid(),
  amount: money("Amount", { nonZero: true }),
  entryDate: pastOrToday("Entry date"),
  remarks: z.string().trim().max(500).optional(),
});

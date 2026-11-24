import { z } from "zod";
import { money, upperName, optionalEmail, optionalPhone } from "./common";

export const createAgentSchema = z.object({
  name: upperName("Agent name"),
  phone: optionalPhone,
  email: optionalEmail,
  companyId: z.string().uuid(),
  openingBalance: money("Opening balance"),
});

export const assignAgentSchema = z.object({
  agentId: z.string().uuid(),
  companyId: z.string().uuid(),
  openingBalance: money("Opening balance"),
});

export const updateAgentSchema = z.object({
  agentId: z.string().uuid(),
  name: upperName("Agent name"),
  phone: optionalPhone,
  email: optionalEmail,
});

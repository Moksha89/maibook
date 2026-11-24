import { z } from "zod";
import { money, nameField, optionalEmail, optionalPhone } from "./common";

export const createAgentSchema = z.object({
  name: nameField("Agent name"),
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
  name: nameField("Agent name"),
  phone: optionalPhone,
  email: optionalEmail,
});

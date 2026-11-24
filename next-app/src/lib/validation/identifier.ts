import { z } from "zod";
import { percent } from "./common";

export const identifierSchema = z.object({
  companyId: z.string().uuid(),
  agentId: z.string().uuid(),
  value: z.string().trim().min(1, "ID code is required.").max(120, "ID code is too long.").regex(/^[^\s].*$/, "ID code cannot start with a space."),
  type: z.enum(["AGENT", "SUB_AGENT"]),
  percentageRate: percent("Percentage rate"),
});

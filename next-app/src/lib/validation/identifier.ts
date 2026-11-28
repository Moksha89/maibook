import { z } from "zod";
import { percent } from "./common";

export const identifierSchema = z.object({
  companyId: z.preprocess((value) => (value === "" || value == null ? undefined : value), z.string().uuid().optional()),
  agentId: z.preprocess((value) => (value === "" || value == null ? undefined : value), z.string().uuid().optional()),
  value: z.string().trim().min(1, "ID name is required.").max(120, "ID name is too long.").regex(/^[^\s].*$/, "ID name cannot start with a space."),
  type: z.enum(["AGENT", "SUB_AGENT"]),
  percentageRate: z.preprocess((value) => (value === "" || value == null ? undefined : value), percent("Percentage rate").optional()),
});

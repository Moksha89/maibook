import { z } from "zod";
import { money } from "./common";

/** Free text saved in CAPITALS (like ledger remarks). */
const upperText = () => z.string().transform((value) => value.replace(/\s+/g, " ").trim().toUpperCase());

const fields = {
  amount: money("Amount", { positive: true }),
  category: upperText().pipe(z.string().min(1, "Category is required.").max(60, "Category must be at most 60 characters.")),
  remarks: upperText().pipe(z.string().max(500, "Remarks must be at most 500 characters.")).transform((value) => value || null),
};

/** Expenses belong to a company only; the date is recorded automatically when the expense is entered. */
export const createExpenseSchema = z.object({ companyId: z.string().uuid(), ...fields });
export const updateExpenseSchema = z.object({ expenseId: z.string().uuid(), ...fields });

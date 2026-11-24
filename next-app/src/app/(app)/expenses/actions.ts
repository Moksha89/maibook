"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createExpense, deleteExpense, updateExpense } from "@/lib/services/expenses";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validation/expense";
import { whole } from "@/lib/format";

const read = (formData: FormData) => ({ companyId: formData.get("companyId"), expenseId: formData.get("expenseId"), amount: formData.get("amount"), category: formData.get("category") ?? "", remarks: formData.get("remarks") ?? "" });
const failure = (error: unknown, fallback: string): ActionState => ({ status: "error", message: error instanceof Error && !error.message.includes("prisma") ? error.message : fallback });

function refresh(companyId: string) {
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${companyId}`);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/owners", "layout");
}

export async function createExpenseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("expenses.create");
  const parsed = createExpenseSchema.safeParse(read(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const company = await db.company.findFirst({ where: { id: parsed.data.companyId, deletedAt: null }, select: { id: true } });
  if (!company) return { status: "error", message: "This company no longer exists." };
  const session = await requireSession();
  try {
    await createExpense({ ...parsed.data, amount: String(parsed.data.amount) }, session.userId, randomUUID());
  } catch (error) {
    return failure(error, "The expense could not be saved.");
  }
  refresh(parsed.data.companyId);
  return { status: "success", message: `Expense ${whole(parsed.data.amount)} saved.` };
}

export async function updateExpenseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("expenses.update");
  const parsed = updateExpenseSchema.safeParse(read(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const existing = await db.expense.findFirst({ where: { id: parsed.data.expenseId, deletedAt: null }, select: { companyId: true } });
  if (!existing) return { status: "error", message: "This expense no longer exists." };
  await requireCompanyAccess(existing.companyId, "FULL");
  const session = await requireSession();
  const { expenseId, ...input } = parsed.data;
  try {
    await updateExpense(expenseId, { ...input, amount: String(input.amount) }, session.userId, randomUUID());
  } catch (error) {
    return failure(error, "The expense could not be updated.");
  }
  refresh(existing.companyId);
  return { status: "success", message: "Expense updated." };
}

export async function deleteExpenseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("expenses.delete");
  const expense = await db.expense.findFirst({ where: { id: String(formData.get("expenseId") || ""), deletedAt: null }, select: { id: true, companyId: true } });
  if (!expense) return { status: "error", message: "This expense no longer exists." };
  await requireCompanyAccess(expense.companyId, "FULL");
  const session = await requireSession();
  try {
    await deleteExpense(expense.id, session.userId, randomUUID());
  } catch (error) {
    return failure(error, "The expense could not be deleted.");
  }
  refresh(expense.companyId);
  return { status: "success", message: "Expense deleted." };
}

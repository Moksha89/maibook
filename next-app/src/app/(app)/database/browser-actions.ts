"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { isSuperAdmin } from "@/lib/auth/user-guards";
import { requireSession } from "@/lib/auth/session";
import { createBrowserTable, deleteBrowserRow, dropBrowserTable, insertBrowserRow, updateBrowserRow } from "@/lib/services/database-browser-db";

async function requireBrowserAdmin() {
  const session = await requireSession();
  if (!isSuperAdmin(session.user)) throw new Error("Only a super admin can change the database from this tab.");
  return session;
}

function readRecord(formData: FormData, prefix: string) {
  const values: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(prefix) || typeof value !== "string") continue;
    values[key.slice(prefix.length)] = value;
  }
  return values;
}

export async function addBrowserRowAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireBrowserAdmin();
  const table = String(formData.get("table") || "");
  try {
    await insertBrowserRow(table, readRecord(formData, "col:"), session.userId);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "The row could not be added." };
  }
  revalidatePath("/database");
  return { status: "success", message: "Row added." };
}

export async function updateBrowserRowAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireBrowserAdmin();
  const table = String(formData.get("table") || "");
  try {
    await updateBrowserRow(table, readRecord(formData, "key:"), readRecord(formData, "col:"), session.userId);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "The row could not be updated." };
  }
  revalidatePath("/database");
  return { status: "success", message: "Row updated." };
}

export async function deleteBrowserRowAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireBrowserAdmin();
  const table = String(formData.get("table") || "");
  try {
    await deleteBrowserRow(table, readRecord(formData, "key:"), session.userId);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "The row could not be deleted." };
  }
  revalidatePath("/database");
  return { status: "success", message: "Row deleted." };
}

export async function createBrowserTableAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireBrowserAdmin();
  const name = String(formData.get("name") || "");
  const columns: { name: string; type: string }[] = [];
  for (let index = 0; index < 12; index += 1) {
    const columnName = String(formData.get(`columnName${index}`) || "").trim();
    const type = String(formData.get(`columnType${index}`) || "").trim();
    if (!columnName) continue;
    columns.push({ name: columnName, type });
  }
  try {
    await createBrowserTable(name, columns, session.userId);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "The table could not be created." };
  }
  revalidatePath("/database");
  return { status: "success", message: `Table ${name} created.` };
}

export async function dropBrowserTableAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireBrowserAdmin();
  const table = String(formData.get("table") || "");
  const confirmation = String(formData.get("confirmation") || "");
  try {
    await dropBrowserTable(table, confirmation, session.userId);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "The table could not be deleted." };
  }
  revalidatePath("/database");
  return { status: "success", message: `Table ${table} deleted.` };
}

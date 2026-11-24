"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeName } from "@/lib/domain/normalization";
import type { ActionState } from "@/lib/actions/types";
import { companySchema } from "@/lib/validation/company";

function slugify(value: string) {
  const base = normalizeName(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base || "company"}-${randomUUID().slice(0, 6)}`;
}

export async function createCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("companies.create");
  const session = await requireSession();
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const company = await db.company.create({
      data: {
        name: parsed.data.name,
        normalizedName: normalizeName(parsed.data.name),
        slug: slugify(parsed.data.name),
        code: parsed.data.code || null,
        currency: parsed.data.currency,
        defaultRate: parsed.data.defaultRate === "" || parsed.data.defaultRate === undefined ? null : parsed.data.defaultRate,
        auditLogs: { create: { actorId: session.userId, action: "company.create", entityType: "Company", requestId: randomUUID(), newValues: { name: parsed.data.name, code: parsed.data.code } } },
      },
    });
    revalidatePath("/companies");
    revalidatePath("/dashboard");
    return { status: "success", message: `${company.name} was created.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "A company with this name or code already exists." };
    throw error;
  }
}

export async function changeCompanyStatusAction(formData: FormData) {
  await requirePermission("companies.update");
  const session = await requireSession();
  const companyId = String(formData.get("companyId") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  await db.company.update({
    where: { id: companyId },
    data: {
      status,
      auditLogs: { create: { actorId: session.userId, action: "company.status.update", entityType: "Company", requestId: randomUUID(), newValues: { status } } },
    },
  });
  revalidatePath("/companies");
}

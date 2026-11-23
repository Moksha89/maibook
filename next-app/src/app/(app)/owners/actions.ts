"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/domain/normalization";

const schema = z.object({ companyId: z.string().uuid(), name: z.string().trim().min(2).max(120), email: z.string().trim().email().or(z.literal("")), phone: z.string().trim().max(30), agentIds: z.array(z.string().uuid()).max(100) });
export async function createOwnerAction(_: ActionState, formData: FormData): Promise<ActionState> { await requirePermission("owners.create"); const parsed = schema.safeParse({ companyId: formData.get("companyId"), name: formData.get("name"), email: formData.get("email") || "", phone: formData.get("phone") || "", agentIds: formData.getAll("agentIds") }); if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message }; await requireCompanyAccess(parsed.data.companyId, "FULL"); const session = await requireSession(); const validAgents = await db.companyAgent.count({ where: { companyId: parsed.data.companyId, agentId: { in: parsed.data.agentIds }, removedAt: null } }); if (validAgents !== parsed.data.agentIds.length) return { status: "error", message: "One or more selected agents are not assigned to this company." }; try { const owner = await db.owner.create({ data: { companyId: parsed.data.companyId, name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), email: parsed.data.email ? normalizeEmail(parsed.data.email) : null, phoneNumbers: parsed.data.phone ? { create: { phone: normalizePhone(parsed.data.phone), isPrimary: true } } : undefined, assignments: { create: parsed.data.agentIds.map((agentId) => ({ agentId })) } } }); await db.auditLog.create({ data: { actorId: session.userId, companyId: parsed.data.companyId, action: "owner.create", entityType: "Owner", entityId: owner.id, requestId: randomUUID(), newValues: { name: owner.name, agentIds: parsed.data.agentIds } } }); revalidatePath("/owners"); return { status: "success", message: "Owner or business partner created." }; } catch (error) { return { status: "error", message: error instanceof Error && error.message.includes("Unique") ? "That owner already exists for this company." : "The owner could not be created." }; } }

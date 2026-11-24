import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

export interface AuditFilters { q?: string; action?: string; entity?: string; company?: string; user?: string; from?: string; to?: string }

const uuid = z.string().uuid();

export function auditWhere(filters: AuditFilters): Prisma.AuditLogWhereInput {
  const insensitive = "insensitive" as const;
  const createdAt: Prisma.DateTimeFilter = {};
  const from = filters.from ? new Date(`${filters.from}T00:00:00+05:30`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999+05:30`) : null;
  if (from && !Number.isNaN(from.getTime())) createdAt.gte = from;
  if (to && !Number.isNaN(to.getTime())) createdAt.lte = to;
  return {
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
    ...(filters.action ? { action: { contains: filters.action, mode: insensitive } } : {}),
    ...(filters.entity ? { entityType: filters.entity } : {}),
    ...(filters.company && uuid.safeParse(filters.company).success ? { companyId: filters.company } : {}),
    ...(filters.user && uuid.safeParse(filters.user).success ? { actorId: filters.user } : {}),
    ...(filters.q ? { OR: [{ entityType: { contains: filters.q, mode: insensitive } }, { entityId: { contains: filters.q, mode: insensitive } }, { requestId: { contains: filters.q, mode: insensitive } }, { actor: { displayName: { contains: filters.q, mode: insensitive } } }] } : {}),
  };
}

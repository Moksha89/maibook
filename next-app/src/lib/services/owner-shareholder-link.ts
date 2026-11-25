import type { Prisma } from "@prisma/client";

import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/domain/normalization";
import { recordOwnerShare } from "@/lib/services/owner-share-history";

type Tx = Prisma.TransactionClient;

export type OwnerCandidate = {
  id: string;
  createdById: string | null;
  companyId: string | null;
  createdAt: Date;
  companyLinks: { companyId: string }[];
};

/** Pick one existing owner for a normalized name: already linked to the company, then this user, then a standalone owner, then the earliest. */
export function chooseOwner<T extends OwnerCandidate>(owners: T[], opts?: { companyId?: string; actorId?: string }) {
  if (!owners.length) return null;
  if (opts?.companyId) {
    const linked = owners.find((owner) => owner.companyLinks.some((link) => link.companyId === opts.companyId));
    if (linked) return linked;
  }
  if (opts?.actorId) {
    const mine = owners.find((owner) => owner.createdById === opts.actorId);
    if (mine) return mine;
  }
  return owners.find((owner) => owner.companyId == null) ?? owners[0];
}

export async function findOwnerByNormalizedName(tx: Tx, normalizedName: string, opts?: { companyId?: string; actorId?: string }) {
  const owners = await tx.owner.findMany({ where: { normalizedName }, include: { companyLinks: { select: { companyId: true } } }, orderBy: { createdAt: "asc" } });
  return chooseOwner(owners, opts);
}

export async function findOrCreateOwner(
  tx: Tx,
  input: { name: string; email?: string | null; phone?: string | null; actorId?: string | null; companyId?: string },
) {
  const normalizedName = normalizeName(input.name);
  const existing = await findOwnerByNormalizedName(tx, normalizedName, { companyId: input.companyId, actorId: input.actorId ?? undefined });
  if (existing) return existing;
  return tx.owner.create({
    data: {
      createdById: input.actorId ?? null,
      name: input.name.trim().replace(/\s+/g, " ").toUpperCase(),
      normalizedName,
      email: input.email ? normalizeEmail(input.email) : null,
      phoneNumbers: input.phone ? { create: { phone: normalizePhone(input.phone), isPrimary: true } } : undefined,
    },
  });
}

/** Upsert the owner-company partnership to match the shareholder share %. History starts at effectiveFrom (shareholder createdAt on backfill, otherwise now). */
export async function upsertOwnerCompanyLink(tx: Tx, ownerId: string, companyId: string, percentage: Prisma.Decimal | number | string, effectiveFrom?: Date) {
  const existing = await tx.ownerCompany.findUnique({ where: { ownerId_companyId: { ownerId, companyId } } });
  if (existing) {
    if (!existing.percentage.eq(percentage.toString())) {
      await tx.ownerCompany.update({ where: { ownerId_companyId: { ownerId, companyId } }, data: { percentage } });
      await recordOwnerShare(tx, ownerId, companyId, percentage, effectiveFrom ?? new Date());
    }
    return { created: false, ownerId };
  }
  await tx.ownerCompany.create({ data: { ownerId, companyId, percentage } });
  await recordOwnerShare(tx, ownerId, companyId, percentage, effectiveFrom ?? new Date());
  return { created: true, ownerId };
}

/** A shareholder assignment is a partnership: find-or-create the owner by name and keep owner_companies in sync. */
export async function linkOwnerFromShareholder(
  tx: Tx,
  shareholder: { name: string; email?: string | null; phone?: string | null; companyId: string; percentage: Prisma.Decimal | number | string; createdAt?: Date },
  actorId?: string | null,
  effectiveFrom?: Date,
) {
  const owner = await findOrCreateOwner(tx, { name: shareholder.name, email: shareholder.email, phone: shareholder.phone, actorId, companyId: shareholder.companyId });
  await upsertOwnerCompanyLink(tx, owner.id, shareholder.companyId, shareholder.percentage, effectiveFrom ?? shareholder.createdAt);
  return owner;
}

export async function unlinkOwnerFromShareholder(tx: Tx, companyId: string, normalizedName: string) {
  const links = await tx.ownerCompany.findMany({ where: { companyId, owner: { normalizedName } }, select: { ownerId: true } });
  if (!links.length) return [];
  await tx.ownerCompany.deleteMany({ where: { companyId, ownerId: { in: links.map((link) => link.ownerId) } } });
  for (const link of links) await recordOwnerShare(tx, link.ownerId, companyId, 0);
  return links.map((link) => link.ownerId);
}

/** Idempotent: for every live shareholder with no matching owner_companies row, create the owner (if needed) and the link. */
export async function backfillOwnerCompanyLinks(tx: Tx, actorId?: string | null) {
  const shareholders = await tx.shareholder.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    orderBy: [{ normalizedName: "asc" }, { createdAt: "asc" }],
  });
  let linked = 0;
  let createdOwners = 0;
  for (const shareholder of shareholders) {
    const before = await findOwnerByNormalizedName(tx, shareholder.normalizedName, { companyId: shareholder.companyId, actorId: actorId ?? undefined });
    await linkOwnerFromShareholder(tx, shareholder, actorId, shareholder.createdAt);
    if (!before) createdOwners += 1;
    const existed = before?.companyLinks.some((link) => link.companyId === shareholder.companyId);
    if (!existed) linked += 1;
  }
  return { shareholders: shareholders.length, linked, createdOwners };
}

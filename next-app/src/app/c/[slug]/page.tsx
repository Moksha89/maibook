import { notFound, redirect } from "next/navigation";

import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

/** Short company link. Only a signed-in user with access to the company is sent on, so the internal ID is never revealed to anyone else. */
export default async function ShortCompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireSession();
  await requirePermission("companies.read");
  const { slug } = await params;
  const company = await db.company.findFirst({ where: { slug: slug.slice(0, 200), deletedAt: null }, select: { id: true } });
  if (!company) notFound();
  await requireCompanyAccess(company.id, "READ");
  redirect(`/companies/${company.id}`);
}

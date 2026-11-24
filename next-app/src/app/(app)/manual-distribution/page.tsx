import { randomUUID } from "node:crypto";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { DistributionForm } from "./distribution-form";

export default async function ManualDistributionPage() { await requirePermission("ledger.create"); const agents = await db.agent.findMany({ where: { deletedAt: null, companies: { some: { removedAt: null } } }, select: { id: true, name: true, companies: { where: { removedAt: null }, select: { company: { select: { name: true } } } } }, orderBy: { name: "asc" } }); return <><PageHeader title="Manual distribution" /><DistributionForm agents={agents.map((agent) => ({ id: agent.id, name: agent.name, companies: agent.companies.map(({ company }) => company.name).join(", ") }))} idempotencyKey={randomUUID()} /></>; }

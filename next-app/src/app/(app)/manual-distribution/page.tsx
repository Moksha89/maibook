import { randomUUID } from "node:crypto";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { DistributionForm } from "./distribution-form";

export default async function ManualDistributionPage() { await requirePermission("ledger.create"); const agents = await db.agent.findMany({ where: { deletedAt: null, companies: { some: { removedAt: null } } }, select: { id: true, name: true, companies: { where: { removedAt: null }, select: { company: { select: { name: true } } } } }, orderBy: { name: "asc" } }); return <><PageHeader title="Manual distribution" description="Allocate a signed agent amount across assigned companies. Smaller outstanding balances are handled first, then any remainder is split evenly. Posted allocations can be edited or deleted from the Ledger page." /><DistributionForm agents={agents.map((agent) => ({ id: agent.id, name: agent.name, companies: agent.companies.map(({ company }) => company.name).join(", ") }))} idempotencyKey={randomUUID()} /><p className="mt-3 text-xs text-[#647386]">Manual allocations affect agent balances and stay excluded from settlement-derived shareholder profit.</p></>; }

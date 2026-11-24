import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { EditManualAgentForm, EditTransferForm } from "./edit-form";

export default async function EditLedgerEntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  await requirePermission("ledger.update");
  const { entryId } = await params;
  const entry = await db.ledgerEntry.findUnique({ where: { id: entryId }, include: { company: { select: { name: true } }, lines: { where: { accountType: "AGENT" }, include: { agent: { select: { name: true } } }, orderBy: { sequence: "asc" } } } });
  const manual = entry?.entryType === "MANUAL_AGENT" && entry.lines.length === 1;
  if (!entry || entry.deletedAt || (!manual && (entry.entryType !== "TRANSACTION" || entry.lines.length !== 2))) notFound();
  await requireCompanyAccess(entry.companyId, "FULL");
  if (manual) return <><PageHeader title="Edit manual allocation" /><EditManualAgentForm entry={{ id: entry.id, amount: entry.lines[0].coins.toString(), entryDate: entry.entryDate.toISOString().slice(0, 10), remarks: entry.remarks || "" }} /></>;
  const sender = entry.lines.find((line) => line.coins.isNegative()) || entry.lines[0];
  const receiver = entry.lines.find((line) => line.id !== sender.id)!;
  return <><PageHeader title="Edit transfer" /><EditTransferForm entry={{ id: entry.id, companyId: entry.companyId, coins: sender.coins.abs().toString(), rate: sender.rate.toString(), entryDate: entry.entryDate.toISOString().slice(0, 10), remarks: entry.remarks || "" }} /></>;
}

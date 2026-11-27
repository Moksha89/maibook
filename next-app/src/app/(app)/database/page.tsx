import type { Metadata } from "next";
import { DatabaseBackup, Download } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { getBackupHealth } from "@/lib/services/backups";
import { stamp } from "@/lib/format";
import { BackupUploadForm } from "./backup-upload-form";
import { createBackupAction, verifyBackupAction } from "./actions";
import { DeletedTab } from "./deleted-tab";
import { DatabaseBrowserTab } from "./browser-tab";
import { requireSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/user-guards";

export const metadata: Metadata = { title: "Database" };
const exports = [{ key: "companies", label: "Companies" }, { key: "agents", label: "Agents" }, { key: "settlements", label: "Settlements" }, { key: "audit_logs", label: "Audit logs" }, { key: "users", label: "Users without credentials" }];

export default async function DatabasePage({ searchParams }: { searchParams: Promise<{ tab?: string; table?: string; page?: string }> }) {
  await requirePermission("database.read");
  const session = await requireSession();
  const superAdmin = isSuperAdmin(session.user);
  const { tab: rawTab, table, page } = await searchParams;
  const tab = rawTab === "deleted" ? "deleted" : rawTab === "browser" && superAdmin ? "browser" : "backups";
  const [canExport, canCreateBackup, canDownload] = await Promise.all([hasPermission("database.export"), hasPermission("backups.create"), hasPermission("backups.download")]);
  return (
    <>
      <PageHeader title="Database" actions={tab === "backups" && canCreateBackup ? <form action={createBackupAction}><Button type="submit"><DatabaseBackup className="size-4" />Create backup</Button></form> : null} />
      <Tabs label="Database" className="mb-3" active={tab} items={[{ key: "backups", label: "Backups", href: "/database" }, ...(superAdmin ? [{ key: "browser", label: "Database", href: "/database?tab=browser" }] : []), { key: "deleted", label: "Deleted", href: "/database?tab=deleted" }]} />
      {tab === "deleted" ? <DeletedTab /> : tab === "browser" ? <DatabaseBrowserTab table={table} page={page} /> : <BackupsPanel canExport={canExport} canCreateBackup={canCreateBackup} canDownload={canDownload} />}
    </>
  );
}

async function BackupsPanel({ canExport, canCreateBackup, canDownload }: { canExport: boolean; canCreateBackup: boolean; canDownload: boolean }) {
  const [backups, health] = await Promise.all([db.backup.findMany({ orderBy: { createdAt: "desc" }, take: 50 }), getBackupHealth()]);
  return (
    <>
      <div className="mb-3 rounded-lg border bg-white px-3 py-2 text-xs text-[#31435a]"><span className="font-bold">Automatic backups:</span> {health.scheduleLabel}. Last completed: {health.lastCompletedAt ? stamp(health.lastCompletedAt) : "never"}.</div>
      {health.failedSince ? <div className="mb-3 rounded-lg border border-[#f0a9a3] bg-[#fdecea] px-3 py-2 text-xs font-semibold text-[#912018]">The latest backup failed at {stamp(health.failedSince.createdAt)}: {health.failedSince.errorMessage || "unknown error"}</div> : null}
      {health.stale ? <div className="mb-3 rounded-lg border border-[#f0c36d] bg-[#fff4d7] px-3 py-2 text-xs font-semibold text-[#72500c]">No backup has completed within the last 26 hours.</div> : null}
      {canCreateBackup ? <BackupUploadForm /> : null}
      {canExport ? <section className="mb-3 rounded-lg border bg-white p-3"><h2 className="mb-2 text-sm font-bold">Safe table exports</h2><div className="flex flex-wrap gap-2">{exports.map((item) => <LinkButton key={item.key} href={`/api/database/export?table=${item.key}`} variant="secondary" icon={Download}>{item.label}</LinkButton>)}</div></section> : null}
      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Backup history</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="bg-[#fff4d7] text-[#59400f]">
              <tr><th className="px-3 py-2">Created</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Size</th><th className="px-3 py-2">Checksum</th><th className="px-3 py-2">Verified</th><th className="px-3 py-2">Error</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody>{backups.map((backup) => <tr key={backup.id} className="border-t"><td className="px-3 py-2">{stamp(backup.createdAt)}</td><td className="px-3 py-2"><StatusBadge tone={backup.status === "COMPLETED" ? "success" : backup.status === "FAILED" ? "danger" : "warning"}>{backup.status}</StatusBadge></td><td className="px-3 py-2 text-right font-mono">{backup.sizeBytes ? `${(Number(backup.sizeBytes) / 1024 / 1024).toFixed(2)} MB` : "-"}</td><td className="max-w-[220px] truncate px-3 py-2 font-mono text-[10px]" title={backup.checksum || undefined}>{backup.checksum || "-"}</td><td className="px-3 py-2">{stamp(backup.verifiedAt) || "Not verified"}</td><td className="max-w-[260px] truncate px-3 py-2" title={backup.errorMessage || undefined}>{backup.errorMessage || "-"}</td><td className="px-3 py-2"><div className="flex gap-1">{backup.status === "COMPLETED" ? <form action={verifyBackupAction}><input type="hidden" name="backupId" value={backup.id} /><Button type="submit" size="xs" iconOnly variant="secondary">Verify</Button></form> : null}{canDownload && backup.status === "COMPLETED" ? <LinkButton href={`/api/backups/${backup.id}/download`} size="xs" iconOnly variant="secondary">Download</LinkButton> : null}</div></td></tr>)}</tbody>
          </table>
        </div>
        {!backups.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No backups have been created.</p> : null}
      </section>
    </>
  );
}

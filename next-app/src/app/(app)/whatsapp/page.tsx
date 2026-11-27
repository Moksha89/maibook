import type { Metadata } from "next";
import Image from "next/image";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { LiveRefresh } from "@/components/ui/live-refresh";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { FilterForm } from "@/components/ui/filter-form";
import { SegmentedToggle } from "@/components/ui/toggle";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pageRows } from "@/lib/paging";
import { initializeWhatsAppAction, logoutWhatsAppAction } from "./actions";
import { DeliveryForm } from "./delivery-form";
import { stamp } from "@/lib/format";
import { refreshChatsFromBridge, seedChatsFromDeliveries } from "@/lib/services/whatsapp-chat";
import { WhatsAppChat } from "./whatsapp-chat";

export const metadata: Metadata = { title: "WhatsApp" };

type HistoryRow = {
  id: string;
  at: Date;
  recipient: string;
  mode: string;
  status: string;
  attemptCount: number;
  lastError: string | null;
  preview: string;
  entity: string;
};

export default async function WhatsAppPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string; page?: string; chat?: string }> }) {
  await requirePermission("whatsapp.read");
  const session = await requireSession();
  const query = await searchParams;
  const tab = query.tab === "chat" ? "chat" : "history";
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [connection, canConnect, canDisconnect, canSend, reports, deliveries, messages] = await Promise.all([
    db.whatsAppConnection.findUnique({ where: { name: "Primary" } }),
    hasPermission("whatsapp.connect"),
    hasPermission("whatsapp.disconnect"),
    hasPermission("whatsapp.send"),
    db.generatedReport.findMany({ where: { company: accessFilter }, include: { company: { select: { name: true } } }, orderBy: { generatedAt: "desc" }, take: 50 }),
    db.reportDelivery.findMany({ where: { report: { company: accessFilter } }, include: { report: { include: { company: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } }),
    db.whatsAppMessage.findMany({ orderBy: { createdAt: "desc" }, take: 2000 }),
  ]);
  let chatList: { jid: string; name: string | null; isGroup: boolean; lastMessageAt: Date | null; lastPreview: string | null; lastDirection: "IN" | "OUT" | null; lastAck: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | null; unreadCount: number }[] = [];
  let chatMessages: { id: string; providerMessageId: string; fromMe: boolean; body: string | null; mediaType: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "STICKER" | "LOCATION" | "CONTACT" | "UNKNOWN"; mediaFilename: string | null; ack: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED"; timestamp: Date }[] = [];
  let inboundStored = false;
  if (tab === "chat" && connection) {
    const existingChats = await db.whatsAppChat.count({ where: { connectionId: connection.id } });
    if (!existingChats) await seedChatsFromDeliveries(connection.id).catch(() => undefined);
    await refreshChatsFromBridge(connection).catch(() => undefined);
    const rows = await db.whatsAppChat.findMany({ where: { connectionId: connection.id }, orderBy: { lastMessageAt: "desc" } });
    chatList = rows.map((row) => ({ jid: row.jid, name: row.name, isGroup: row.isGroup, lastMessageAt: row.lastMessageAt, lastPreview: row.lastPreview, lastDirection: row.lastDirection, lastAck: row.lastAck, unreadCount: row.unreadCount }));
    const active = query.chat && rows.some((row) => row.jid === query.chat) ? query.chat : rows[0]?.jid;
    if (active) {
      chatMessages = await db.whatsAppChatMessage.findMany({ where: { connectionId: connection.id, chat: { jid: active } }, orderBy: { timestamp: "asc" } });
    }
    inboundStored = (await db.whatsAppChatMessage.count({ where: { connectionId: connection.id, fromMe: false } })) > 0;
  }
    const qrData = connection?.qrCode && connection.status === "QR_READY" ? await QRCode.toDataURL(connection.qrCode, { width: 220, margin: 1, errorCorrectionLevel: "M" }) : null;
  const reportOptions = reports.map((report) => ({ id: report.id, label: `${report.company?.name || "Company"} · ${report.type.replaceAll("_", " ")} · ${report.format} · ${stamp(report.generatedAt)}` }));
  const enabled = process.env.WHATSAPP_DELIVERY_ENABLED === "true";
  const byDelivery = new Map(deliveries.map((row) => [row.id, row]));
  const used = new Set<string>();
  const history: HistoryRow[] = [];
  for (const message of messages) {
    const delivery = message.deliveryId ? byDelivery.get(message.deliveryId) : undefined;
    if (message.deliveryId) used.add(message.deliveryId);
    const report = delivery?.report;
    history.push({
      id: message.id,
      at: message.sentAt ?? message.createdAt,
      recipient: message.recipient,
      mode: message.mode,
      status: message.status,
      attemptCount: message.attemptCount,
      lastError: message.lastError,
      preview: report ? `${report.type.replaceAll("_", " ")} · ${report.format}` : message.mode.replaceAll("_", " "),
      entity: report ? `${report.company?.name || "Company"} · ${report.type.replaceAll("_", " ")}` : "Outbound message",
    });
  }
  for (const delivery of deliveries) {
    if (used.has(delivery.id)) continue;
    history.push({
      id: delivery.id,
      at: delivery.sentAt ?? delivery.createdAt,
      recipient: delivery.recipient,
      mode: delivery.mode,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
      lastError: delivery.lastError,
      preview: `${delivery.report.type.replaceAll("_", " ")} · ${delivery.report.format}`,
      entity: `${delivery.report.company?.name || "Company"} · ${delivery.report.type.replaceAll("_", " ")}`,
    });
  }
  history.sort((left, right) => right.at.getTime() - left.at.getTime());
  const status = query.status || "";
  const filtered = status ? history.filter((row) => row.status === status) : history;
  const paged = pageRows(filtered, query.page);
  const statusLabel = (value: string) => value === "SENT" ? "Sent · awaiting delivery" : value === "DELIVERED" ? "Delivered" : value === "QUEUED" ? "Queued" : value === "FAILED" ? "Failed" : value;
  const statusTone = (value: string) => value === "DELIVERED" ? "success" : value === "FAILED" ? "danger" : value === "SENT" ? "neutral" : "warning";

  return <>
    <LiveRefresh active={tab === "chat" || connection?.status === "INITIALIZING" || connection?.status === "QR_READY"} intervalMs={tab === "chat" ? 5000 : 3000} />
    <PageHeader title="WhatsApp" />
    <div className="mb-3 grid gap-3 lg:grid-cols-[300px_1fr]">
      <section className="rounded-lg border bg-white p-3">
        <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Primary connection</h2><StatusBadge tone={connection?.status === "CONNECTED" ? "success" : connection?.status === "FAILED" ? "danger" : connection?.status === "QR_READY" ? "warning" : "neutral"}>{connection?.status || "DISCONNECTED"}</StatusBadge></div>
        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between gap-3"><dt className="text-[#647386]">Environment</dt><dd className="font-semibold">{enabled ? "Delivery enabled" : "Safe local mode"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#647386]">Phone</dt><dd className="font-mono">{connection?.phoneNumber || "-"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#647386]">Last connected</dt><dd>{stamp(connection?.lastConnectedAt) || "Never"}</dd></div>
        </dl>
        {connection?.lastError ? <p className="mt-3 rounded-md bg-[#fff4e5] p-2 text-xs text-[#8a4b08]">{connection.lastError}</p> : null}
        <div className="mt-3 flex gap-2">{canConnect ? <form action={initializeWhatsAppAction}><Button type="submit">Initialize</Button></form> : null}{canDisconnect && connection ? <form action={logoutWhatsAppAction}><Button type="submit" variant="secondary">Logout</Button></form> : null}</div>
      </section>
      <section className="grid min-h-[220px] place-items-center rounded-lg border bg-white p-3">{qrData ? <div className="text-center"><Image src={qrData} alt="WhatsApp login QR code" width={220} height={220} unoptimized className="mx-auto" /></div> : <div className="text-center"><p className="text-sm font-semibold text-[#31435a]">No QR code available</p></div>}</section>
    </div>
    {canSend && reportOptions.length ? <DeliveryForm reports={reportOptions} /> : null}
    <Tabs className="mt-3 mb-3" label="WhatsApp history" minTabWidth={160} active={tab} items={[{ key: "history", label: "Delivery history", href: "/whatsapp?tab=history" }, { key: "chat", label: "Web WhatsApp", href: "/whatsapp?tab=chat" }]} />
    {tab === "chat" ? (
      <WhatsAppChat chats={chatList} messages={chatMessages} selected={query.chat} historyAvailable={inboundStored} connected={connection?.status === "CONNECTED"} />
    ) : (
      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <h2 className="text-sm font-bold">Delivery history</h2>
          <FilterForm className="flex items-center gap-1.5">
            <input type="hidden" name="tab" value="history" />
            <SegmentedToggle name="status" label="Delivery status" defaultValue={status} options={[{ value: "", label: "Any" }, { value: "QUEUED", label: "Queued" }, { value: "SENT", label: "Sent" }, { value: "DELIVERED", label: "Delivered" }, { value: "FAILED", label: "Failed" }]} />
          </FilterForm>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Sent</th><th className="px-3 py-2">Recipient</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Linked</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Retries</th><th className="px-3 py-2">Failure</th></tr></thead>
          <tbody>{paged.rows.map((row) => <tr key={row.id} className="border-t">
            <td className="whitespace-nowrap px-3 py-2">{stamp(row.at)}</td>
            <td className="px-3 py-2 font-mono">{row.recipient}</td>
            <td className="px-3 py-2">{row.preview}</td>
            <td className="px-3 py-2">{row.entity}</td>
            <td className="px-3 py-2"><StatusBadge tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusBadge></td>
            <td className="px-3 py-2 text-right font-mono">{Math.max(0, row.attemptCount - 1)}</td>
            <td className="max-w-[260px] truncate px-3 py-2" title={row.lastError || undefined}>{row.lastError || "-"}</td>
          </tr>)}</tbody>
        </table></div>
        {!filtered.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No delivery attempts have been recorded.</p> : null}
        <Pagination pathname="/whatsapp" params={{ tab: "history", status }} page={paged.current} pages={paged.pages} total={paged.total} />
      </section>
    )}
  </>;
}

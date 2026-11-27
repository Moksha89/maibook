import Link from "next/link";

import { stamp } from "@/lib/format";

type Row = { id: string; at: Date; recipient: string; status: string; preview: string; entity: string };

function ticks(status: string) {
  if (status === "DELIVERED") return "✓✓";
  if (status === "SENT") return "✓";
  if (status === "FAILED") return "!";
  return "…";
}

/** View-only chat pane built from outbound delivery events. Inbound message text is not stored today. */
export function WhatsAppChat({ rows, selected, inboundStored, bodiesStored }: { rows: Row[]; selected?: string; inboundStored: boolean; bodiesStored: boolean }) {
  const conversations = new Map<string, Row[]>();
  for (const row of rows) {
    const list = conversations.get(row.recipient) ?? [];
    list.push(row);
    conversations.set(row.recipient, list);
  }
  const contacts = [...conversations.entries()].map(([recipient, messages]) => {
    const latest = messages[0];
    return { recipient, latest, count: messages.length };
  });
  const active = selected && conversations.has(selected) ? selected : contacts[0]?.recipient;
  const thread = active ? (conversations.get(active) ?? []).slice().reverse() : [];

  return (
    <section className="grid min-h-[70vh] overflow-hidden rounded-lg border bg-white md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b md:border-b-0 md:border-r">
        <div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Conversations</h2></div>
        {!contacts.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No conversations yet.</p> : (
          <ul className="max-h-[30vh] overflow-y-auto md:max-h-[calc(70vh-40px)]">
            {contacts.map((contact) => (
              <li key={contact.recipient}>
                <Link prefetch={false} href={`/whatsapp?tab=chat&chat=${encodeURIComponent(contact.recipient)}`} className={`block border-b px-3 py-2 ${contact.recipient === active ? "bg-[#e8f4ff]" : "hover:bg-[#f7f8fa]"}`}>
                  <div className="flex items-center justify-between gap-2"><span className="truncate font-mono text-xs font-semibold">{contact.recipient}</span><span className="shrink-0 text-[10px] text-[#647386]">{stamp(contact.latest.at)}</span></div>
                  <p className="mt-0.5 truncate text-[11px] text-[#647386]">{contact.latest.preview}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <div className="flex min-h-[40vh] flex-col bg-[#ece5dd]">
        <div className="border-b bg-white px-3 py-2"><h2 className="font-mono text-sm font-bold">{active || "Web WhatsApp"}</h2></div>
        {!inboundStored || !bodiesStored ? (
          <p className="border-b bg-[#fff8e6] px-3 py-2 text-[11px] text-[#72500c]">Incoming WhatsApp messages are not stored, and outgoing message text is not saved. These threads show outbound delivery events only (recipient, time and status). To show full chats, the webhook needs to persist inbound message content and the outbound text at send time.</p>
        ) : null}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {thread.map((row) => (
            <div key={row.id} className="ml-auto max-w-[80%] rounded-lg rounded-br-sm bg-[#dcf8c6] px-3 py-1.5 text-xs shadow-sm">
              <p className="font-semibold">{row.preview}</p>
              <p className="text-[#3b4d63]">{row.entity}</p>
              <p className="mt-1 text-right text-[10px] text-[#647386]">{stamp(row.at)} <span title={row.status}>{ticks(row.status)}</span></p>
            </div>
          ))}
          {!thread.length ? <p className="py-8 text-center text-xs text-[#647386]">No messages in this conversation.</p> : null}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { chatClock, chatDayLabel, chatListTime } from "@/lib/format";
import { displayName, previewFor } from "@/lib/services/whatsapp-chat-map";
import { loadEarlierMessagesAction, openChatAction } from "./actions";

export type ChatListItem = {
  jid: string;
  name: string | null;
  isGroup: boolean;
  lastMessageAt: Date | string | null;
  lastPreview: string | null;
  lastDirection: "IN" | "OUT" | null;
  lastAck: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | null;
  unreadCount: number;
};

export type ChatMessageItem = {
  id: string;
  providerMessageId: string;
  fromMe: boolean;
  body: string | null;
  mediaType: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "STICKER" | "LOCATION" | "CONTACT" | "UNKNOWN";
  mediaFilename: string | null;
  ack: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  timestamp: Date | string;
};

const AVATAR = ["#53bdeb", "#00a884", "#7f66ff", "#ff8a00", "#02a698", "#dc6c00", "#d3396d"];

function initials(name: string) {
  const parts = name.replace(/^\+/, "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.replace(/^\+/, "").slice(0, 2).toUpperCase() || "?";
}

function avatarColor(key: string) {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR[hash % AVATAR.length];
}

function ticks(ack: ChatMessageItem["ack"] | ChatListItem["lastAck"], fromMe: boolean) {
  if (!fromMe) return null;
  if (ack === "FAILED") return <span className="text-[#e54d42]" title="Failed">!</span>;
  if (ack === "PENDING") return <span className="text-[#667781]" title="Pending">✓</span>;
  if (ack === "READ") return <span className="text-[#53bdeb]" title="Read">✓✓</span>;
  if (ack === "DELIVERED") return <span className="text-[#667781]" title="Delivered">✓✓</span>;
  return <span className="text-[#667781]" title="Sent">✓</span>;
}

type ThreadRow = { type: "day"; label: string; key: string } | { type: "message"; message: ChatMessageItem };

function withDays(messages: ChatMessageItem[]) {
  const rows: ThreadRow[] = [];
  let last = "";
  for (const message of messages) {
    const label = chatDayLabel(message.timestamp);
    if (label && label !== last) {
      rows.push({ type: "day", label, key: `day-${label}-${String(message.timestamp)}` });
      last = label;
    }
    rows.push({ type: "message", message });
  }
  return rows;
}

export function WhatsAppChat({
  chats,
  messages,
  selected,
  historyAvailable,
  connected,
}: {
  chats: ChatListItem[];
  messages: ChatMessageItem[];
  selected?: string;
  historyAvailable: boolean;
  connected: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((chat) => {
      const name = displayName(chat).toLowerCase();
      return name.includes(term) || chat.jid.toLowerCase().includes(term) || (chat.lastPreview || "").toLowerCase().includes(term);
    });
  }, [chats, query]);
  const active = selected && chats.some((chat) => chat.jid === selected) ? selected : filtered[0]?.jid;
  const current = chats.find((chat) => chat.jid === active);
  const thread = withDays(messages);
  const title = current ? displayName(current) : "Web WhatsApp";

  return (
    <section className="grid min-h-[72vh] overflow-hidden rounded-lg border border-[#d1d7db] bg-white shadow-sm md:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex min-h-[40vh] flex-col border-b border-[#e9edef] bg-white md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2">
          <h2 className="text-sm font-bold text-[#111b21]">Chats</h2>
        </div>
        <div className="bg-white px-3 py-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="w-full rounded-lg bg-[#f0f2f5] px-3 py-2 text-xs text-[#111b21] outline-none placeholder:text-[#667781]"
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {filtered.map((chat) => {
            const name = displayName(chat);
            const isActive = chat.jid === active;
            return (
              <li key={chat.jid}>
                <Link
                  prefetch={false}
                  href={`/whatsapp?tab=chat&chat=${encodeURIComponent(chat.jid)}`}
                  onClick={() => { if (chat.unreadCount) { const data = new FormData(); data.set("jid", chat.jid); void openChatAction(data); } }}
                  className={`flex items-center gap-3 border-b border-[#e9edef] px-3 py-2.5 ${isActive ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: avatarColor(chat.jid) }}>{initials(name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-[#111b21]">{name}</span>
                      <span className={`shrink-0 text-[10px] ${chat.unreadCount ? "font-semibold text-[#00a884]" : "text-[#667781]"}`}>{chat.lastMessageAt ? chatListTime(chat.lastMessageAt) : ""}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1 text-[12px] text-[#667781]">
                        {ticks(chat.lastAck, chat.lastDirection === "OUT")}
                        <span className="truncate">{chat.lastPreview || ""}</span>
                      </span>
                      {chat.unreadCount ? <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#00a884] px-1 text-[10px] font-bold text-white">{chat.unreadCount > 99 ? "99+" : chat.unreadCount}</span> : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          {!filtered.length ? <li className="px-3 py-10 text-center text-xs text-[#667781]">{chats.length ? "No chats match that search." : "No conversations yet."}</li> : null}
        </ul>
      </aside>
      <div className="flex min-h-[50vh] flex-col bg-[#efeae2]">
        <div className="flex items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-3 py-2">
          {current ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: avatarColor(current.jid) }}>{initials(title)}</span> : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-[#111b21]">{title}</h2>
            <p className="truncate text-[11px] text-[#667781]">{current?.isGroup ? "Group" : current ? current.jid.replace(/@.*$/, "") : connected ? "Select a chat" : "WhatsApp is not connected"}</p>
          </div>
        </div>
        {!historyAvailable ? (
          <p className="border-b border-[#efe0c8] bg-[#fff8e6] px-3 py-2 text-[11px] text-[#72500c]">Older messages appear once WhatsApp sends chat history to this linked device. New sent and received messages are saved from this update onward. Opening a chat here does not send a read receipt.</p>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3" style={{ backgroundImage: "linear-gradient(#efeae2, #efeae2)" }}>
          {current ? (
            <form action={loadEarlierMessagesAction} className="mb-2 flex justify-center">
              <input type="hidden" name="jid" value={current.jid} />
              <button type="submit" className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#00a884] shadow-sm">Load earlier messages</button>
            </form>
          ) : null}
          {thread.map((row) => row.type === "day" ? (
            <div key={row.key} className="my-2 flex justify-center">
              <span className="rounded-md bg-[#fffef5] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#54656f] shadow-sm">{row.label}</span>
            </div>
          ) : (
            <div key={row.message.id} className={`flex ${row.message.fromMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-lg px-2 py-1.5 text-[13px] leading-5 text-[#111b21] shadow-sm ${row.message.fromMe ? "rounded-br-sm bg-[#d9fdd3]" : "rounded-bl-sm bg-white"}`}>
                <MessageBody message={row.message} />
                <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] text-[#667781] ${row.message.fromMe ? "" : ""}`}>
                  <span>{chatClock(row.message.timestamp)}</span>
                  {ticks(row.message.ack, row.message.fromMe)}
                </p>
              </div>
            </div>
          ))}
          {!thread.length ? <p className="py-16 text-center text-xs text-[#667781]">{current ? "No messages in this conversation yet." : "Select a conversation."}</p> : null}
        </div>
      </div>
    </section>
  );
}

function MessageBody({ message }: { message: ChatMessageItem }) {
  const caption = (message.body || "").trim();
  if (message.mediaType === "TEXT" || message.mediaType === "UNKNOWN") {
    return <p className="whitespace-pre-wrap break-words">{caption || (message.mediaType === "UNKNOWN" ? "Message" : "")}</p>;
  }
  const label = previewFor(message.mediaType, caption, message.mediaFilename);
  return (
    <div>
      <div className="mb-1 grid h-24 place-items-center rounded-md bg-black/5 text-[12px] font-semibold text-[#54656f]">{label}</div>
      {caption && message.mediaType !== "DOCUMENT" && message.mediaType !== "CONTACT" && message.mediaType !== "AUDIO" && message.mediaType !== "STICKER" ? <p className="whitespace-pre-wrap break-words">{caption}</p> : null}
    </div>
  );
}

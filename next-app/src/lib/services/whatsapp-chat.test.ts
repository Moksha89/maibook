import { describe, expect, it } from "vitest";

import {
  asAck,
  asMediaType,
  chatJidFromRecipient,
  displayName,
  isGroupJid,
  mergeByProviderId,
  messageTimestamp,
  previewFor,
} from "./whatsapp-chat-map";

describe("whatsapp chat mapping", () => {
  it("builds a user jid from a stored phone number", () => {
    expect(chatJidFromRecipient("+91 98765 43210")).toBe("919876543210@s.whatsapp.net");
    expect(chatJidFromRecipient("971501234567")).toBe("971501234567@s.whatsapp.net");
    expect(chatJidFromRecipient("")).toBe("");
  });

  it("treats only @g.us jids as groups, never personal @lid accounts", () => {
    expect(isGroupJid("120363@g.us")).toBe(true);
    expect(isGroupJid("971501234567@s.whatsapp.net")).toBe(false);
    expect(isGroupJid("1234567890@lid")).toBe(false);
  });

  it("maps media types and previews like WhatsApp list rows", () => {
    expect(asMediaType("image")).toBe("IMAGE");
    expect(asMediaType("foo")).toBe("UNKNOWN");
    expect(previewFor("IMAGE", "Site report")).toBe("📷 Site report");
    expect(previewFor("IMAGE", "")).toBe("📷 Photo");
    expect(previewFor("AUDIO", null)).toBe("🎤 Voice message");
    expect(previewFor("DOCUMENT", null, "ledger.pdf")).toBe("📄 ledger.pdf");
    expect(previewFor("TEXT", "Hello")).toBe("Hello");
  });

  it("maps WhatsApp ack names including the bridge's SERVER_ACK / DELIVERY_ACK", () => {
    expect(asAck("SERVER_ACK", true)).toBe("SENT");
    expect(asAck("DELIVERY_ACK", true)).toBe("DELIVERED");
    expect(asAck("READ", true)).toBe("READ");
    expect(asAck("ERROR", true)).toBe("FAILED");
    expect(asAck(undefined, false)).toBe("DELIVERED");
    expect(asAck(undefined, true)).toBe("SENT");
  });

  it("accepts unix seconds or ISO timestamps", () => {
    expect(messageTimestamp(1_700_000_000).getTime()).toBe(1_700_000_000_000);
    expect(messageTimestamp(1_700_000_000_000).getTime()).toBe(1_700_000_000_000);
    expect(messageTimestamp("2026-11-27T18:00:00.000Z").toISOString()).toBe("2026-11-27T18:00:00.000Z");
    expect(messageTimestamp(new Date("2026-11-27T18:00:00.000Z")).toISOString()).toBe("2026-11-27T18:00:00.000Z");
  });

  it("merges history batches idempotently by provider message id", () => {
    const first = [
      { providerMessageId: "A", body: "hi", ack: "SENT" },
      { providerMessageId: "B", body: "old", ack: "SENT" },
    ];
    const second = [
      { providerMessageId: "B", body: "old", ack: "DELIVERED" },
      { providerMessageId: "C", body: "new", ack: "SENT" },
    ];
    const merged = mergeByProviderId(first, second);
    expect(merged).toHaveLength(3);
    expect(merged.find((row) => row.providerMessageId === "B")).toEqual({ providerMessageId: "B", body: "old", ack: "DELIVERED" });
    expect(mergeByProviderId(merged, second)).toHaveLength(3);
  });

  it("falls back to a +number display name when no contact name is known", () => {
    expect(displayName({ jid: "971501234567@s.whatsapp.net", name: "Amit" })).toBe("Amit");
    expect(displayName({ jid: "971501234567@s.whatsapp.net" })).toBe("+971501234567");
    expect(displayName({ jid: "120363@g.us", isGroup: true })).toBe("Group");
  });
});

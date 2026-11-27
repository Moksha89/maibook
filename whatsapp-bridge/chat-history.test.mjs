import assert from "node:assert/strict";
import test from "node:test";
import { extractContent, isGroupJid, normalizedFromWaMessage, shouldSkipMessage, storeFor } from "./chat-history.mjs";

test("extracts text, captions and media types", () => {
  assert.equal(extractContent({ message: { conversation: "Hello" } }).type, "TEXT");
  assert.equal(extractContent({ message: { imageMessage: { caption: "Site" } } }).type, "IMAGE");
  assert.equal(extractContent({ message: { imageMessage: { caption: "Site" } } }).text, "Site");
  assert.equal(extractContent({ message: { documentMessage: { fileName: "a.pdf", caption: "Ledger" } } }).filename, "a.pdf");
  assert.equal(extractContent({ message: { audioMessage: { ptt: true } } }).type, "AUDIO");
});

test("skips protocol and reaction messages", () => {
  assert.equal(shouldSkipMessage({ message: { protocolMessage: { type: 0 } } }), true);
  assert.equal(shouldSkipMessage({ message: { reactionMessage: { text: "👍" } } }), true);
  assert.equal(shouldSkipMessage({ message: { conversation: "Hi" } }), false);
});

test("normalizes inbound and outbound messages idempotently by id", () => {
  const store = storeFor("test-session");
  const inbound = normalizedFromWaMessage(store, {
    key: { id: "ABC", remoteJid: "971501234567@s.whatsapp.net", fromMe: false },
    message: { conversation: "Hi" },
    messageTimestamp: 1732723200,
    pushName: "Amit",
  });
  assert.equal(inbound.fromMe, false);
  assert.equal(inbound.direction, "IN");
  assert.equal(inbound.body, "Hi");
  assert.equal(inbound.contactName, "Amit");
  assert.equal(inbound.timestamp, 1732723200000);
  assert.equal(isGroupJid(inbound.chatJid), false);
  const again = normalizedFromWaMessage(store, {
    key: { id: "ABC", remoteJid: "971501234567@s.whatsapp.net", fromMe: false },
    message: { conversation: "Hi" },
    messageTimestamp: 1732723200,
    pushName: "Amit",
  });
  assert.equal(again.providerMessageId, inbound.providerMessageId);
});

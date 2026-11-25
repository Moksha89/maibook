/**
 * Client IP as seen by our own reverse proxy. On maibook.co Apache drops any client-sent X-Forwarded-For / X-Real-IP
 * and appends the real address itself, so only the entries added by trusted hops (TRUSTED_PROXY_HOPS, default 1)
 * at the right-hand end of the header are believed. Anything a client prepends is ignored.
 */
export function clientIpFrom(forwardedFor: string | null | undefined, trustedHops = Number(process.env.TRUSTED_PROXY_HOPS || 1)) {
  const hops = Number.isInteger(trustedHops) && trustedHops > 0 ? trustedHops : 1;
  const entries = (forwardedFor ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
  const candidate = entries.length >= hops ? entries[entries.length - hops] : entries[0];
  return candidate && /^[0-9a-fA-F:.]{2,45}$/.test(candidate) ? candidate : "local";
}

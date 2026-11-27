/** Default page size for data tables across the app. */
export const PAGE_SIZE = 20;

export function parsePage(raw: string | string[] | undefined, total: number, pageSize = PAGE_SIZE) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const pages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize) || 1);
  const requested = Number.parseInt(value || "1", 10);
  const current = Number.isFinite(requested) ? Math.min(Math.max(1, requested), pages) : 1;
  return { current, pages, total, pageSize, skip: (current - 1) * pageSize, take: pageSize };
}

/** Slice an already-ordered (and, for ledgers, already running-balanced) list for one page. */
export function pageRows<T>(rows: T[], raw: string | string[] | undefined, pageSize = PAGE_SIZE) {
  const info = parsePage(raw, rows.length, pageSize);
  return { ...info, rows: rows.slice(info.skip, info.skip + info.take) };
}

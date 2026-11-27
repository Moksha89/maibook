/** Money is shown as whole numbers everywhere (rounded half away from zero, never "-0"). Stored values keep their decimals. */
export function whole(value: unknown): string {
  const n = Number(value == null ? 0 : typeof value === "object" ? String(value) : value);
  if (!Number.isFinite(n)) return "0";
  return String(Math.sign(n) * Math.round(Math.abs(n)) || 0);
}

/** Whole-number money with thousands separators. */
export function wholeLocale(value: unknown, locale?: string): string {
  return Number(whole(value)).toLocaleString(locale);
}

/** Closing balances only: positive blue, negative red, zero neutral. Other money figures stay uncoloured. */
export const BALANCE_BLUE = "#2563eb";
export const BALANCE_RED = "#d92d20";
export function balanceColor(value: unknown): string | undefined {
  const n = Number(whole(value));
  return n > 0 ? BALANCE_BLUE : n < 0 ? BALANCE_RED : undefined;
}
export function balanceTone(value: unknown): string {
  const n = Number(whole(value));
  return n > 0 ? "text-[#2563eb]" : n < 0 ? "text-[#d92d20]" : "";
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const ordinal = (day: number) => `${day}${day % 100 >= 11 && day % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][day % 10] ?? "th"}`;
const pad = (value: number) => String(value).padStart(2, "0");
const IST_MS = 5.5 * 3600_000;
type DateLike = Date | string | number | null | undefined;
const toDate = (value: DateLike) => (value === null || value === undefined || value === "" ? null : value instanceof Date ? value : new Date(value));

/** "17th NOV 2026 22:15" in India time. Empty string for no value. */
export function stamp(value: DateLike): string {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  const ist = new Date(date.getTime() + IST_MS);
  return `${ordinal(ist.getUTCDate())} ${MONTHS[ist.getUTCMonth()]} ${ist.getUTCFullYear()} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

/** For calendar-day fields (entry or settlement date): the day as stored, with the time the record was made. */
export function dayStamp(day: DateLike, at?: DateLike): string {
  const date = toDate(day);
  if (!date || Number.isNaN(date.getTime())) return "";
  const label = `${ordinal(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  const time = toDate(at);
  if (!time || Number.isNaN(time.getTime())) return label;
  const ist = new Date(time.getTime() + IST_MS);
  return `${label} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

function istParts(value: DateLike) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;
  const ist = new Date(date.getTime() + IST_MS);
  return { date, ist, day: ist.getUTCDate(), month: ist.getUTCMonth(), year: ist.getUTCFullYear(), hours: ist.getUTCHours(), minutes: ist.getUTCMinutes(), weekday: ist.getUTCDay() };
}

/** Clock time in the same zone as stamp(), e.g. "22:15". */
export function chatClock(value: DateLike): string {
  const parts = istParts(value);
  return parts ? `${pad(parts.hours)}:${pad(parts.minutes)}` : "";
}

/** Date separator label: "TODAY", "YESTERDAY", or "17th NOV 2026". */
export function chatDayLabel(value: DateLike, now: DateLike = new Date()): string {
  const parts = istParts(value);
  const today = istParts(now);
  if (!parts || !today) return "";
  const key = (p: NonNullable<ReturnType<typeof istParts>>) => `${p.year}-${p.month}-${p.day}`;
  if (key(parts) === key(today)) return "TODAY";
  const yesterday = istParts(new Date((today.date as Date).getTime() - 24 * 3600_000));
  if (yesterday && key(parts) === key(yesterday)) return "YESTERDAY";
  return `${ordinal(parts.day)} ${MONTHS[parts.month]} ${parts.year}`;
}

/** Chat list timestamp: time if today, YESTERDAY, or "17th NOV". */
export function chatListTime(value: DateLike, now: DateLike = new Date()): string {
  const parts = istParts(value);
  const today = istParts(now);
  if (!parts || !today) return "";
  if (parts.year === today.year && parts.month === today.month && parts.day === today.day) return chatClock(value);
  const label = chatDayLabel(value, now);
  if (label === "YESTERDAY") return "YESTERDAY";
  if (parts.year === today.year) return `${ordinal(parts.day)} ${MONTHS[parts.month]}`;
  return `${ordinal(parts.day)} ${MONTHS[parts.month]} ${parts.year}`;
}

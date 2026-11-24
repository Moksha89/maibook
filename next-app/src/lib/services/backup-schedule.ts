/** Pure helpers for the scheduled backup, kept free of server-only imports so they are unit testable. */

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { hour: read("hour"), minute: read("minute"), second: read("second") };
}

/** Minutes since the most recent occurrence of hour:00 in the given time zone (always 0 to 1439). */
export function minutesSinceScheduledTime(now: Date, timeZone: string, hour: number) {
  const { hour: h, minute, second } = zonedParts(now, timeZone);
  const sinceMidnight = h * 60 + minute + second / 60;
  return (sinceMidnight - hour * 60 + 1440) % 1440;
}

export function parsePgConnection(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const socketHost = url.searchParams.get("host");
  return {
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    host: socketHost || url.hostname || "",
    port: url.port || "",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

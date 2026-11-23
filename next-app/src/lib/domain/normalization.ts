export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const leadingPlus = trimmed.startsWith("+") ? "+" : "";
  return `${leadingPlus}${trimmed.replace(/\D/g, "")}`;
}

export function normalizeLoginIdentifier(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return normalizeEmail(trimmed);
  if (/^[+\d().\s-]+$/.test(trimmed)) return normalizePhone(trimmed);
  return normalizeName(trimmed);
}

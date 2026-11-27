/** SQL-client helpers for the admin Database tab. Identifiers are validated before any query is built. */

export const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
export const COLUMN_TYPES = ["text", "integer", "bigint", "numeric", "boolean", "timestamptz", "date", "uuid", "jsonb"] as const;
export type ColumnType = (typeof COLUMN_TYPES)[number];

const SENSITIVE = /password|passwd|token|secret|session|api[_-]?key|refresh|credential|hash|salt|otp/i;

/** App-owned tables. Dropping one of these will break the application. */
export const CORE_TABLES = new Set([
  "agent_ids", "agents", "api_tokens", "application_settings", "audit_logs", "backup_recipients", "backups",
  "companies", "company_access", "company_agents", "device_registrations", "expenses", "generated_reports",
  "identifier_agent_assignments", "identifier_share_history", "jobs", "ledger_entries", "ledger_entry_lines",
  "login_throttles", "otp_challenges", "owner_agent_assignments", "owner_companies", "owner_entries",
  "owner_phone_numbers", "owner_share_history", "owners", "permissions", "report_deliveries", "report_templates",
  "role_permissions", "roles", "sessions", "settlements", "shareholder_entries", "shareholders", "sites",
  "upline_entries", "upline_group_members", "upline_groups", "uplines", "user_permission_overrides",
  "user_roles", "users", "whatsapp_connections", "whatsapp_messages",
]);

export function assertIdent(name: string, label = "Name") {
  const value = name.trim();
  if (!IDENTIFIER.test(value) || value.length > 63) throw new Error(`${label} is not a valid SQL identifier.`);
  return value;
}

export function quoteIdent(name: string) {
  return `"${assertIdent(name)}"`;
}

export function isSensitiveColumn(name: string) {
  return SENSITIVE.test(name);
}

export function isCoreTable(name: string) {
  return CORE_TABLES.has(name);
}

export function isAllowedColumnType(type: string): type is ColumnType {
  return (COLUMN_TYPES as readonly string[]).includes(type);
}

export function maskValue(column: string, value: unknown) {
  if (!isSensitiveColumn(column)) return value;
  return value == null || value === "" ? value : "••••";
}

export function maskRow(row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
  for (const key of Object.keys(out)) out[key] = maskValue(key, out[key]);
  return out;
}

/** Strip sensitive keys so they cannot be written through the browser. */
export function writableValues(values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    assertIdent(key, "Column");
    if (isSensitiveColumn(key)) continue;
    out[key] = value;
  }
  return out;
}

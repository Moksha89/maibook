import "server-only";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { assertIdent, isAllowedColumnType, isCoreTable, isSensitiveColumn, maskRow, quoteIdent, writableValues } from "@/lib/services/database-browser";

export type BrowserColumn = { name: string; type: string; nullable: boolean; defaultValue: string | null; isPrimary: boolean };
export type BrowserTable = { name: string; estimatedRows: number };

export async function listPublicTables(): Promise<BrowserTable[]> {
  const rows = await db.$queryRaw<{ name: string; estimated: bigint }[]>`
    SELECT c.relname AS name, GREATEST(c.reltuples, 0)::bigint AS estimated
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `;
  return rows.map((row) => ({ name: row.name, estimatedRows: Number(row.estimated) }));
}

export async function tableColumns(table: string): Promise<BrowserColumn[]> {
  const name = assertIdent(table, "Table");
  const columns = await db.$queryRaw<{ name: string; type: string; nullable: string; defaultValue: string | null; isPrimary: boolean }[]>`
    SELECT
      cols.column_name AS name,
      cols.data_type AS type,
      cols.is_nullable AS nullable,
      cols.column_default AS "defaultValue",
      EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public' AND tc.table_name = ${name} AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = cols.column_name
      ) AS "isPrimary"
    FROM information_schema.columns cols
    WHERE cols.table_schema = 'public' AND cols.table_name = ${name}
    ORDER BY cols.ordinal_position
  `;
  return columns.map((column) => ({ ...column, nullable: column.nullable === "YES" }));
}

export async function tableCount(table: string) {
  const ident = quoteIdent(table);
  const rows = await db.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(*)::bigint AS count FROM ${ident}`);
  return Number(rows[0]?.count ?? 0);
}

export async function tableRows(table: string, skip: number, take: number) {
  const ident = quoteIdent(table);
  const columns = await tableColumns(table);
  const primary = columns.filter((column) => column.isPrimary).map((column) => quoteIdent(column.name)).join(", ");
  const order = primary || "1";
  const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM ${ident} ORDER BY ${order} OFFSET $1 LIMIT $2`,
    skip,
    take,
  );
  return rows.map((row) => maskRow(row));
}

function asSqlValue(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean" || typeof value === "number") return value;
  return String(value);
}

export async function insertBrowserRow(table: string, values: Record<string, unknown>, actorId: string) {
  const ident = quoteIdent(table);
  const writable = writableValues(values);
  const columns = Object.keys(writable);
  if (!columns.length) throw new Error("Add at least one value.");
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const sql = `INSERT INTO ${ident} (${columns.map(quoteIdent).join(", ")}) VALUES (${placeholders}) RETURNING *`;
  const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...columns.map((key) => asSqlValue(writable[key])));
  await auditBrowser(actorId, "database.row.create", table, { newValues: maskRow(writable) });
  return rows[0] ? maskRow(rows[0]) : null;
}

export async function updateBrowserRow(table: string, key: Record<string, unknown>, values: Record<string, unknown>, actorId: string) {
  const ident = quoteIdent(table);
  const writable = writableValues(values);
  const setKeys = Object.keys(writable);
  if (!setKeys.length) throw new Error("No writable columns to update.");
  const where = writableValues(key);
  const whereKeys = Object.keys(where);
  if (!whereKeys.length) throw new Error("A primary key is required to update a row.");
  const setSql = setKeys.map((name, index) => `${quoteIdent(name)} = $${index + 1}`).join(", ");
  const whereSql = whereKeys.map((name, index) => `${quoteIdent(name)} = $${setKeys.length + index + 1}`).join(" AND ");
  const sql = `UPDATE ${ident} SET ${setSql} WHERE ${whereSql} RETURNING *`;
  const params = [...setKeys.map((keyName) => asSqlValue(writable[keyName])), ...whereKeys.map((keyName) => asSqlValue(where[keyName]))];
  const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...params);
  if (!rows[0]) throw new Error("The row could not be updated.");
  await auditBrowser(actorId, "database.row.update", table, { oldValues: maskRow(where), newValues: maskRow(writable) });
  return maskRow(rows[0]);
}

export async function deleteBrowserRow(table: string, key: Record<string, unknown>, actorId: string) {
  const ident = quoteIdent(table);
  const where = writableValues(key);
  const whereKeys = Object.keys(where);
  if (!whereKeys.length) throw new Error("A primary key is required to delete a row.");
  const whereSql = whereKeys.map((name, index) => `${quoteIdent(name)} = $${index + 1}`).join(" AND ");
  const sql = `DELETE FROM ${ident} WHERE ${whereSql} RETURNING *`;
  const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...whereKeys.map((keyName) => asSqlValue(where[keyName])));
  if (!rows[0]) throw new Error("The row could not be deleted.");
  await auditBrowser(actorId, "database.row.delete", table, { oldValues: maskRow(rows[0]) });
  return maskRow(rows[0]);
}

export async function createBrowserTable(name: string, columns: { name: string; type: string }[], actorId: string) {
  const table = assertIdent(name, "Table");
  if (!columns.length) throw new Error("Add at least one column.");
  const defs: string[] = [];
  const seen = new Set<string>();
  for (const column of columns) {
    const columnName = assertIdent(column.name, "Column");
    if (seen.has(columnName)) throw new Error(`Column ${columnName} is listed twice.`);
    if (!isAllowedColumnType(column.type)) throw new Error(`Column type ${column.type} is not allowed.`);
    if (isSensitiveColumn(columnName)) throw new Error("Sensitive column names are not allowed on new tables.");
    seen.add(columnName);
    defs.push(`${quoteIdent(columnName)} ${column.type}`);
  }
  if (![...seen].includes("id")) defs.unshift(`"id" bigserial PRIMARY KEY`);
  await db.$executeRawUnsafe(`CREATE TABLE ${quoteIdent(table)} (${defs.join(", ")})`);
  await auditBrowser(actorId, "database.table.create", table, { newValues: { columns } });
  return table;
}

export async function dropBrowserTable(name: string, confirmation: string, actorId: string) {
  const table = assertIdent(name, "Table");
  if (confirmation !== table) throw new Error("Type the exact table name to confirm deletion.");
  await db.$executeRawUnsafe(`DROP TABLE ${quoteIdent(table)}`);
  await auditBrowser(actorId, "database.table.drop", table, { oldValues: { table, core: isCoreTable(table) } });
  return table;
}

async function auditBrowser(actorId: string, action: string, table: string, values: { oldValues?: object; newValues?: object }) {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      entityType: "DatabaseTable",
      entityId: randomUUID(),
      requestId: randomUUID(),
      oldValues: values.oldValues as Prisma.InputJsonValue | undefined,
      newValues: { table, ...(values.newValues ?? {}) } as Prisma.InputJsonValue,
    },
  });
}

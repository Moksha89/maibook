"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormFooter } from "@/components/ui/form-footer";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { useModalAction } from "@/components/ui/use-modal-action";
import type { ActionState } from "@/lib/actions/types";
import { COLUMN_TYPES, isCoreTable, isSensitiveColumn } from "@/lib/services/database-browser";
import { addBrowserRowAction, createBrowserTableAction, deleteBrowserRowAction, dropBrowserTableAction, updateBrowserRowAction } from "./browser-actions";

const field = "mt-0.5 !text-xs [&_input]:!h-7 [&_select]:!h-7";
const labelClass = "block text-[11px] font-semibold text-[#3b4d63]";

function HiddenPairs({ prefix, values }: { prefix: string; values: Record<string, string> }) {
  return <>{Object.entries(values).map(([key, value]) => <input key={key} type="hidden" name={`${prefix}${key}`} value={value} />)}</>;
}

function display(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function CreateTableForm() {
  const [state, action, pending] = useModalAction(createBrowserTableAction, {} as ActionState);
  return (
    <FormModal compact size="md" trigger="Add table" title="Create table">
      <form action={action} className="text-xs">
        <label className={labelClass}>Table name<Input name="name" className={field} required pattern="[A-Za-z_][A-Za-z0-9_]*" /></label>
        <div className="mt-2 space-y-1.5">{[0, 1, 2, 3].map((index) => (
          <div key={index} className="grid grid-cols-[1fr_140px] gap-1.5">
            <Input name={`columnName${index}`} className={field} placeholder={index === 0 ? "Column" : ""} />
            <Select name={`columnType${index}`} className={field} defaultValue="text">{COLUMN_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</Select>
          </div>
        ))}</div>
        {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Creating" : "Create table"}</Button></FormFooter>
      </form>
    </FormModal>
  );
}

export function DropTableForm({ table }: { table: string }) {
  const [state, action, pending] = useModalAction(dropBrowserTableAction, {} as ActionState);
  const core = isCoreTable(table);
  return (
    <FormModal compact size="sm" trigger="Drop table" title={`Drop ${table}`} triggerClassName="!size-7 !bg-[#d92d20] !text-white !ring-0 [&_svg]:!size-3.5">
      <form action={action} className="text-xs">
        <input type="hidden" name="table" value={table} />
        {core ? <p className="mb-2 rounded-md border border-[#f0a9a3] bg-[#fdecea] px-2 py-1.5 text-[11px] font-semibold text-[#912018]">This is a core application table. Dropping it will break the app.</p> : null}
        <label className={labelClass}>Type {table} to confirm<Input name="confirmation" className={field} required autoComplete="off" /></label>
        {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter className="!mt-2"><Button type="submit" size="sm" variant="secondary" className="!bg-[#d92d20] !text-white" disabled={pending}>{pending ? "Dropping" : "Drop table"}</Button></FormFooter>
      </form>
    </FormModal>
  );
}

export function AddRowForm({ table, columns }: { table: string; columns: { name: string; isPrimary: boolean; defaultValue: string | null }[] }) {
  const [state, action, pending] = useModalAction(addBrowserRowAction, {} as ActionState);
  const fields = columns.filter((column) => !isSensitiveColumn(column.name) && !(column.isPrimary && column.defaultValue));
  return (
    <FormModal compact size="md" trigger="Add row" title={`Add row to ${table}`}>
      <form action={action} className="grid gap-1.5 text-xs">
        <input type="hidden" name="table" value={table} />
        {fields.map((column) => <label key={column.name} className={labelClass}>{column.name}<Input name={`col:${column.name}`} className={field} /></label>)}
        {state.message ? <p className={`text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save row"}</Button></FormFooter>
      </form>
    </FormModal>
  );
}

export function EditRowForm({ table, columns, row }: { table: string; columns: { name: string; isPrimary: boolean }[]; row: Record<string, unknown> }) {
  const [state, action, pending] = useModalAction(updateBrowserRowAction, {} as ActionState);
  const keys: Record<string, string> = {};
  for (const column of columns.filter((item) => item.isPrimary)) keys[column.name] = display(row[column.name]);
  const fields = columns.filter((column) => !isSensitiveColumn(column.name) && !column.isPrimary);
  return (
    <FormModal compact size="md" trigger="Edit" title="Edit row" triggerClassName="!size-7 [&_svg]:!size-3.5">
      <form action={action} className="grid gap-1.5 text-xs">
        <input type="hidden" name="table" value={table} />
        <HiddenPairs prefix="key:" values={keys} />
        {fields.map((column) => <label key={column.name} className={labelClass}>{column.name}<Input name={`col:${column.name}`} className={field} defaultValue={display(row[column.name])} /></label>)}
        {state.message ? <p className={`text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save"}</Button></FormFooter>
      </form>
    </FormModal>
  );
}

export function DeleteRowForm({ table, keys }: { table: string; keys: Record<string, string> }) {
  const [state, action, pending] = useModalAction(deleteBrowserRowAction, {} as ActionState);
  const [confirm, setConfirm] = useState(false);
  return (
    <FormModal compact size="sm" trigger="Delete" title="Delete row" triggerClassName="!size-7 [&_svg]:!size-3.5">
      <form action={action} className="text-xs" onSubmit={(event) => { if (!confirm) { event.preventDefault(); setConfirm(true); } }}>
        <input type="hidden" name="table" value={table} />
        <HiddenPairs prefix="key:" values={keys} />
        <p>{confirm ? "Delete this row? This cannot be undone." : "This row will be permanently deleted from the table."}</p>
        {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter className="!mt-2"><Button type="submit" size="sm" variant="secondary" className="!bg-[#d92d20] !text-white" disabled={pending}>{pending ? "Deleting" : confirm ? "Confirm delete" : "Delete row"}</Button></FormFooter>
      </form>
    </FormModal>
  );
}

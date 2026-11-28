"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { modalField, modalLabel } from "@/components/ui/form-styles";

export type AgentSplitRow = { agentId: string; split: string };

export function emptyAgentRow(): AgentSplitRow {
  return { agentId: "", split: "100" };
}

export function splitTotal(rows: AgentSplitRow[]) {
  const filled = rows.filter((row) => row.agentId);
  if (!filled.length) return { hasAgents: false, complete: true, total: 0 };
  const total = Math.round(filled.reduce((sum, row) => sum + Number(row.split || 0), 0) * 10000) / 10000;
  const complete = filled.length === rows.length && rows.every((row) => row.agentId && Number(row.split) > 0) && total === 100;
  return { hasAgents: true, complete, total };
}

export function IdentifierAgentRows({ agents, rows, onChange }: { agents: { id: string; name: string }[]; rows: AgentSplitRow[]; onChange: (rows: AgentSplitRow[]) => void }) {
  const summary = splitTotal(rows);
  return (
    <div className="col-span-2">
      {rows.map((row, index) => (
        <div key={index} className="mb-1 flex items-end gap-1">
          <label className={`${modalLabel} min-w-0 flex-1`}>
            {index === 0 ? "Agent" : <span className="sr-only">Agent</span>}
            <Select name="agentIds" className={modalField} value={row.agentId} onChange={(event) => onChange(rows.map((item, itemIndex) => itemIndex === index ? { ...item, agentId: event.target.value, split: item.split || (rows.length === 1 ? "100" : item.split) } : item))}>
              <option value="">None</option>
              {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </Select>
          </label>
          {index === 0 ? <Button type="button" iconOnly size="xs" icon={Plus} aria-label="Add agent" className="mb-0 !size-7 shrink-0" onClick={() => onChange([...rows, { agentId: "", split: "" }])} /> : <Button type="button" variant="secondary" iconOnly size="xs" icon={Minus} aria-label="Remove agent" className="mb-0 !size-7 shrink-0" onClick={() => onChange(rows.filter((_, itemIndex) => itemIndex !== index))} />}
          <label className={`${modalLabel} w-[4.5rem] shrink-0`}>
            {index === 0 ? "%" : <span className="sr-only">Split %</span>}
            <Input name="agentSplits" icon={null} className={modalField} type="number" min="0" max="100" step="0.0001" value={row.split} onChange={(event) => onChange(rows.map((item, itemIndex) => itemIndex === index ? { ...item, split: event.target.value } : item))} />
          </label>
        </div>
      ))}
      {summary.hasAgents ? <p className={`text-[11px] font-semibold ${summary.complete ? "text-[#16794b]" : "text-[#b42318]"}`}>{summary.total}%</p> : null}
    </div>
  );
}

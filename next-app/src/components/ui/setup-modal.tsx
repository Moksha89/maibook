import { Info } from "lucide-react";

import { NoCloseScope } from "@/components/ui/modal-context";

import { FormModal } from "@/components/ui/form-modal";

/** An "Add …" pill that always opens a modal: the real form when prerequisites exist, otherwise a guided setup step. */
export function AddModal({ trigger, title, size, ready, setup, children }: { trigger: string; title: string; size?: "md" | "lg" | "xl"; ready: boolean; setup: React.ReactNode; children: React.ReactNode }) {
  return <FormModal trigger={trigger} title={title} size={size}>{ready ? children : setup}</FormModal>;
}

export function SetupNotice({ title, children, form }: { title: string; children?: React.ReactNode; form?: React.ReactNode }) {
  return (
    <div data-setup-step>
      <div className="mb-3 flex items-start gap-2 rounded-2xl border border-[#cfdcff] bg-[#eef3ff] p-3 text-xs text-[#26407f]"><Info className="mt-0.5 size-4 shrink-0" /><div><p className="font-bold">{title}</p></div></div>
      <NoCloseScope>{form}</NoCloseScope>
    </div>
  );
}

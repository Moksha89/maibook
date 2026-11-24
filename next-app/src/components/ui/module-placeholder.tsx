import { Construction } from "lucide-react";
import { PageHeader } from "./page-header";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return <><PageHeader title={title} description={description} /><div className="rounded-lg border bg-white px-4 py-10 text-center"><Construction className="mx-auto size-5 text-[#a97819]" /><p className="mt-2 text-sm font-semibold text-[#203650]">Module foundation is ready</p><p className="mx-auto mt-1 max-w-md text-xs text-[#647386]">Database models and access boundaries are in place. The operational screens are being connected in dependency order.</p></div></>;
}

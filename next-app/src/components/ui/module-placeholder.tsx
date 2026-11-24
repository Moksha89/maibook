import { Construction } from "lucide-react";
import { PageHeader } from "./page-header";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return <><PageHeader title={title} /><div className="rounded-lg border bg-white px-4 py-10 text-center"><Construction className="mx-auto size-5 text-[#a97819]" /><p className="mt-2 text-sm font-semibold text-[#203650]">Module foundation is ready</p></div></>;
}

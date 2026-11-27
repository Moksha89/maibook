import { cookies } from "next/headers";

export type DirectoryView = "grid" | "list";

/** URL view wins; otherwise the remembered cookie; otherwise grid. */
export async function directoryView(section: string, requested?: string | string[]) {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  if (raw === "grid" || raw === "list") return raw;
  const saved = (await cookies()).get(`maibook-view-${section}`)?.value;
  return saved === "list" ? "list" : "grid";
}

import { Tabs } from "@/components/ui/tabs";

function hrefFor(pathname: string, params: Record<string, string | undefined>, deleted: boolean) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "deleted" && key !== "page") search.set(key, value);
  }
  if (deleted) search.set("deleted", "1");
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** All entries vs Deleted entries. All excludes soft-deleted rows at the query; Deleted shows only those rows. */
export function EntryScopeTabs({
  pathname,
  params = {},
  deleted,
  allLabel = "All entries",
  deletedLabel = "Deleted entries",
}: {
  pathname: string;
  params?: Record<string, string | undefined>;
  deleted: boolean;
  allLabel?: string;
  deletedLabel?: string;
}) {
  return (
    <Tabs
      label="Entry scope"
      className="mb-3"
      minTabWidth={140}
      active={deleted ? "deleted" : "all"}
      items={[
        { key: "all", label: allLabel, href: hrefFor(pathname, params, false) },
        { key: "deleted", label: deletedLabel, href: hrefFor(pathname, params, true) },
      ]}
    />
  );
}

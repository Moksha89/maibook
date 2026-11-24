export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-3 flex min-h-9 items-start justify-between gap-2">
      <div className="min-w-0"><h1 className="truncate text-base font-bold tracking-[-0.01em] text-[#0d1a2c] sm:text-lg">{title}</h1>{description ? <p className="mt-0.5 hidden text-xs text-[#647386] sm:block">{description}</p> : null}</div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">{actions}</div> : null}
    </div>
  );
}

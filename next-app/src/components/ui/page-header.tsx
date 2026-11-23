export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex min-h-9 flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-lg font-bold tracking-[-0.01em] text-[#0d1a2c]">{title}</h1>{description ? <p className="mt-0.5 text-xs text-[#647386]">{description}</p> : null}</div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse space-y-3" role="status" aria-label="Loading page">
      <div className="h-9 w-56 rounded-full bg-[#e3e8ef]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((index) => <div key={index} className="h-20 rounded-2xl bg-[#e9edf3]" />)}</div>
      <div className="rounded-2xl border bg-white p-3"><div className="mb-3 h-5 w-40 rounded-full bg-[#e3e8ef]" />{[0, 1, 2, 3, 4].map((index) => <div key={index} className="mb-2 h-8 rounded-lg bg-[#eef1f6]" />)}</div>
    </div>
  );
}

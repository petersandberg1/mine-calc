export function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-scania-border bg-white shadow-sm">
      <div className="border-b border-scania-border px-6 py-5">
        <div className="text-lg font-semibold text-scania-ink">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-scania-muted">{subtitle}</div> : null}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}
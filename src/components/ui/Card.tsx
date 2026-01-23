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
    <section className="rounded-3xl border border-ahs-border bg-white shadow-sm">
      <div className="border-b border-ahs-border px-6 py-5">
        <div className="text-lg font-semibold text-ahs-ink">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-ahs-muted">{subtitle}</div> : null}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}
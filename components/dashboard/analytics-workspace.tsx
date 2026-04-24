const insightCards = [
  { title: "Late Entries", value: "6", tone: "bg-amber-500/10 text-amber-300" },
  { title: "Early Exits", value: "3", tone: "bg-red-500/10 text-red-300" },
  { title: "Average Rate", value: "91%", tone: "bg-emerald-500/10 text-emerald-300" },
  { title: "At Risk Students", value: "4", tone: "bg-sky-500/10 text-sky-300" }
];

export function AnalyticsWorkspace() {
  return (
    <div className="space-y-6">
      <section className="frame p-6">
        <div className="section-title">Analytics</div>
        <div className="grid gap-4 md:grid-cols-4">
          {insightCards.map((card) => (
            <div key={card.title} className="rounded-3xl border border-line bg-panelSoft/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">{card.title}</div>
              <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${card.tone}`}>{card.value}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="frame p-6">
          <div className="section-title">Daily Trend</div>
          <div className="h-72 rounded-3xl border border-dashed border-line bg-panelSoft/50" />
        </div>
        <div className="frame p-6">
          <div className="section-title">Weekly Trend</div>
          <div className="h-72 rounded-3xl border border-dashed border-line bg-panelSoft/50" />
        </div>
      </section>
    </div>
  );
}

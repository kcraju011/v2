const sessions = [
  { subject: "Data Structures", date: "2026-04-24", time: "09:00 - 09:10", present: 34, status: "closed" },
  { subject: "Operating Systems", date: "2026-04-23", time: "10:30 - 10:40", present: 31, status: "closed" }
];

export function HistoryWorkspace() {
  return (
    <section className="frame p-6">
      <div className="section-title">History</div>
      <div className="mb-5 max-w-xs">
        <input type="date" defaultValue="2026-04-24" />
      </div>
      <div className="space-y-3">
        {sessions.map((session) => (
          <article key={`${session.subject}-${session.date}`} className="rounded-3xl border border-line bg-panelSoft/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{session.subject}</div>
                <div className="mt-1 text-xs text-textMuted">
                  {session.date} · {session.time}
                </div>
              </div>
              <div className="text-right">
                <div className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{session.present} present</div>
                <div className="mt-2 text-xs text-textMuted">{session.status}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

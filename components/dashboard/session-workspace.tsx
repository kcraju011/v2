export function SessionWorkspace() {
  return (
    <section className="frame p-6">
      <div className="section-title">Session Control</div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-3xl border border-line bg-panelSoft/60 p-5">
          <h2 className="text-lg font-semibold text-white">Open Attendance Session</h2>
          <div className="mt-4 space-y-4">
            <input placeholder="Subject / Class" />
            <select defaultValue="10">
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
            </select>
            <button className="w-full rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
              Open Attendance Session
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="text-sm font-semibold text-white">Current live session</div>
          <div className="mt-3 text-2xl font-bold text-emerald-300">Data Structures - 3CSE B</div>
          <div className="mt-2 text-sm text-textMuted">Closes in 08:34</div>
          <button className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            Stop Session
          </button>
        </div>
      </div>
    </section>
  );
}

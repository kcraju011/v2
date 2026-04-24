export function StudentWorkspace() {
  return (
    <section className="frame p-6">
      <div className="section-title">Student Workspace</div>
      <div className="grid gap-5 lg:grid-cols-[1fr_.9fr]">
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="text-lg font-semibold text-white">Attendance marked</div>
          <div className="mt-4 space-y-3 text-sm text-textMuted">
            <div>Full Name: Aarav Shetty</div>
            <div>Attendance Date: 2026-04-24</div>
            <div>Entry Time: 09:02:12</div>
            <div>Distance From Centre: 32m</div>
            <div>Login Method: biometric</div>
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-panelSoft/60 p-5">
          <div className="text-sm font-semibold text-white">Post-login student actions</div>
          <div className="mt-4 space-y-3">
            <button className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              Mark Exit
            </button>
            <button className="w-full rounded-2xl border border-line bg-panelSoft px-4 py-3 text-sm font-semibold text-textMuted">
              View My Attendance
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

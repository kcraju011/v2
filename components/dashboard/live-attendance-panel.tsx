"use client";

import { useMemo, useState } from "react";
import { useLiveAttendance } from "@/hooks/use-live-attendance";
import type { TenantConfig } from "@/lib/tenant/config";

type TabKey = "present" | "recent" | "absent";

export function LiveAttendancePanel({ tenant }: { tenant: TenantConfig }) {
  const rows = useLiveAttendance(tenant);
  const [tab, setTab] = useState<TabKey>("present");

  const filtered = useMemo(() => {
    if (tab === "present") return rows.filter((row) => row.status === "in");
    if (tab === "recent") return rows.filter((row) => row.status === "recent");
    return rows.filter((row) => row.status === "out");
  }, [rows, tab]);

  return (
    <section className="frame p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="section-title">Live Attendance</div>
          <h2 className="text-lg font-semibold text-white">Realtime presence feed</h2>
        </div>
        <div className="inline-flex rounded-2xl border border-line bg-panelSoft p-1">
          {(["present", "recent", "absent"] as TabKey[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === item ? "bg-accent/15 text-accent" : "text-textMuted"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {filtered.map((row) => (
          <article key={row.id} className="rounded-3xl border border-line bg-panelSoft/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{row.name}</div>
                <div className="mt-1 text-xs text-textMuted">
                  {row.email} · {row.department}
                </div>
                <div className="mt-2 text-xs text-textMuted">
                  Entry {row.entryTime ?? "-"} {row.exitTime ? `· Exit ${row.exitTime}` : ""}
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.status === "in" ? "bg-emerald-500/15 text-emerald-300" : row.status === "recent" ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"}`}>
                {row.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

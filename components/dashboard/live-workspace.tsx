import { LiveAttendancePanel } from "@/components/dashboard/live-attendance-panel";
import { LiveMap } from "@/components/maps/live-map";
import type { TenantConfig } from "@/lib/tenant/config";

export function LiveWorkspace({ tenant }: { tenant: TenantConfig }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Present", value: "34" },
          { label: "Absent", value: "12" },
          { label: "Total", value: "46" },
          { label: "Rate", value: "74%" }
        ].map((item) => (
          <div key={item.label} className="frame p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-textMuted">{item.label}</div>
            <div className="mt-3 text-3xl font-bold text-white">{item.value}</div>
          </div>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <LiveAttendancePanel tenant={tenant} />
        <LiveMap tenant={tenant} />
      </section>
    </>
  );
}

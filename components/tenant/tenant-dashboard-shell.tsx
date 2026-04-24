import Link from "next/link";
import Image from "next/image";
import { BarChart3, Building, Compass, History, Radio, School, UserRound } from "lucide-react";
import type { TenantConfig } from "@/lib/tenant/config";

const navItems = [
  { href: "dashboard/teacher", label: "Session", icon: School },
  { href: "dashboard/live", label: "Live", icon: Radio },
  { href: "dashboard/history", label: "History", icon: History },
  { href: "dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "dashboard/student", label: "Student", icon: UserRound },
  { href: "dashboard/admin", label: "Admin", icon: Building }
];

export function TenantDashboardShell({
  tenant,
  children
}: {
  tenant: TenantConfig;
  children: React.ReactNode;
}) {
  return (
    <main className="shell">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="frame p-4">
          <div className="rounded-3xl border border-line bg-[linear-gradient(160deg,#0d1a40,#080f2a)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/5">
                {tenant.logoUrl ? (
                  <Image src={tenant.logoUrl} alt={tenant.alias} width={56} height={56} className="h-14 w-14 object-cover" />
                ) : (
                  <div className="rounded-2xl bg-accent/15 p-3 text-accent">
                    <Compass className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{tenant.alias}</div>
                <div className="text-xs text-textMuted">{tenant.city}</div>
              </div>
            </div>
            <div className="mt-4 text-sm font-semibold text-white">{tenant.name}</div>
            <div className="mt-2 text-sm leading-6 text-textMuted">{tenant.description}</div>
          </div>
          <nav className="mt-4 space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={`/t/${tenant.slug}/${href}`}
                className="flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-textMuted hover:border-line hover:bg-panelSoft hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="space-y-6">{children}</section>
      </div>
    </main>
  );
}

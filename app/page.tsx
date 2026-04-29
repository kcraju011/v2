import Link from "next/link";
import { Building2, Fingerprint, MapPinned, RadioTower, ShieldCheck } from "lucide-react";
import { getDefaultTenant, TENANT_REGISTRY } from "@/lib/tenant/config";

const features = [
  { icon: ShieldCheck, title: "Tenant Isolation", text: "Single database, strict RLS, role-aware routing." },
  { icon: Fingerprint, title: "Biometric Ready", text: "WebAuthn-aligned auth and attendance workflows." },
  { icon: RadioTower, title: "Realtime Live View", text: "Attendance, sessions, and live campus presence." },
  { icon: MapPinned, title: "Geofence Tracking", text: "GPS entry, movement logging, and auto-exit." },
  { icon: Building2, title: "College SaaS", text: "Tenant branding, departments, roles, and locations." }
];

export default function HomePage() {
  const defaultTenant = getDefaultTenant();
  return (
    <main className="shell">
      <div className="frame overflow-hidden">
        <section className="border-b border-line bg-[linear-gradient(160deg,#0d1a40,#080f2a)] px-6 py-10 md:px-10 md:py-14">
          <div className="pill">BioAttend Supabase Migration</div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            Multi-tenant attendance SaaS for student, teacher, and admin operations.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-textMuted md:text-base">
            This Next.js 14 shell mirrors the current BioAttend flows while moving authentication,
            realtime updates, analytics, and tenant isolation into Supabase.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-2xl bg-gradient-to-r from-accent to-accentDeep px-5 py-3 text-sm font-semibold text-white" href={`/t/${defaultTenant.slug}/login`}>
              Open {defaultTenant.alias} Login
            </Link>
            <Link className="rounded-2xl border border-line bg-panelSoft px-5 py-3 text-sm font-semibold text-textMuted hover:border-accent hover:text-accent" href={`/t/${defaultTenant.slug}/register`}>
              Open Registration
            </Link>
          </div>
        </section>

        <section className="border-b border-line px-6 py-5 md:px-10">
          <div className="section-title">Tenant Routing</div>
          <div className="grid gap-3 md:grid-cols-2">
            {TENANT_REGISTRY.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/t/${tenant.slug}`}
                className="rounded-3xl border border-line bg-panelSoft/60 p-4 hover:border-accent/50"
              >
                <div className="text-sm font-semibold text-white">{tenant.alias}</div>
                <div className="mt-1 text-sm text-textMuted">{tenant.name}</div>
                <div className="mt-3 text-xs text-accent">{`/t/${tenant.slug}`}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-5 md:px-10 md:py-8">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-line bg-panelSoft/60 p-5">
              <div className="mb-4 inline-flex rounded-2xl bg-accent/10 p-3 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-textMuted">{text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
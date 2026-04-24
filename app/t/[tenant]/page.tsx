import Link from "next/link";
import { requireTenantFromSlug } from "@/lib/tenant/resolve";

export default function TenantHomePage({ params }: { params: { tenant: string } }) {
  const tenant = requireTenantFromSlug(params.tenant);

  return (
    <main className="shell">
      <div className="frame overflow-hidden">
        <section className="bg-[linear-gradient(160deg,#0d1a40,#080f2a)] px-6 py-10 md:px-10 md:py-14">
          <div className="pill">{tenant.alias}</div>
          <h1 className="mt-5 text-4xl font-bold text-white md:text-6xl">{tenant.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-textMuted md:text-base">{tenant.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/t/${tenant.slug}/login`} className="rounded-2xl bg-gradient-to-r from-accent to-accentDeep px-5 py-3 text-sm font-semibold text-white">
              Student Login
            </Link>
            <Link href={`/t/${tenant.slug}/register`} className="rounded-2xl border border-line bg-panelSoft px-5 py-3 text-sm font-semibold text-textMuted hover:border-accent hover:text-accent">
              Register User
            </Link>
            <Link href={`/t/${tenant.slug}/dashboard/teacher`} className="rounded-2xl border border-line bg-panelSoft px-5 py-3 text-sm font-semibold text-textMuted hover:border-accent hover:text-accent">
              Open Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

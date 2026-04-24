import Link from "next/link";
import { getDefaultTenant } from "@/lib/tenant/config";

export default function NotFound() {
  const tenant = getDefaultTenant();

  return (
    <main className="shell">
      <div className="frame p-10 text-center">
        <div className="section-title">Tenant Not Found</div>
        <h1 className="text-3xl font-bold text-white">The requested tenant route does not exist.</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-textMuted">
          Use a valid canonical route such as `/t/sit` or `/t/ssit`, or open one of the tenant workspaces below.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/t/${tenant.slug}`} className="rounded-2xl bg-gradient-to-r from-accent to-accentDeep px-5 py-3 text-sm font-semibold text-white">
            Open Default Tenant
          </Link>
          <Link href="/" className="rounded-2xl border border-line bg-panelSoft px-5 py-3 text-sm font-semibold text-textMuted hover:border-accent hover:text-accent">
            Back To Home
          </Link>
        </div>
      </div>
    </main>
  );
}

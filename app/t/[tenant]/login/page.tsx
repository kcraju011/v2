import { LoginShell } from "@/components/auth/login-shell";
import { requireTenantFromSlug } from "@/lib/tenant/resolve";

export default function TenantLoginPage({ params }: { params: { tenant: string } }) {
  const tenant = requireTenantFromSlug(params.tenant);

  return (
    <main className="shell">
      <LoginShell tenant={tenant} />
    </main>
  );
}

import { RegisterShell } from "@/components/auth/register-shell";
import { requireTenantFromSlug } from "@/lib/tenant/resolve";

export default function TenantRegisterPage({ params }: { params: { tenant: string } }) {
  const tenant = requireTenantFromSlug(params.tenant);

  return (
    <main className="shell">
      <RegisterShell tenant={tenant} />
    </main>
  );
}

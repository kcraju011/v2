import { RegisterShell } from "@/components/auth/register-shell";
import { requireTenantFromSlug } from "@/lib/tenant/resolve";

export default async function TenantRegisterPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = requireTenantFromSlug(slug);

  return (
    <main className="shell">
      <RegisterShell tenant={tenant} />
    </main>
  );
}
import { LoginShell } from "@/components/auth/login-shell";
import { requireTenantFromSlug } from "@/lib/tenant/resolve";

export default async function TenantLoginPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = requireTenantFromSlug(slug);

  return (
    <main className="shell">
      <LoginShell tenant={tenant} />
    </main>
  );
}

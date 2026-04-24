import { TenantDashboardShell } from "@/components/tenant/tenant-dashboard-shell";
import { requireTenantFromSlug } from "@/lib/tenant/resolve";

export default function TenantDashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  const tenant = requireTenantFromSlug(params.tenant);
  return <TenantDashboardShell tenant={tenant}>{children}</TenantDashboardShell>;
}

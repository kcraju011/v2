import { requireTenantFromSlug } from "@/lib/tenant/resolve";

export default function TenantLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  requireTenantFromSlug(params.tenant);
  return children;
}

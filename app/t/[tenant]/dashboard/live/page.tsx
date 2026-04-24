import { LiveWorkspace } from "@/components/dashboard/live-workspace";
import { requireTenantFromSlug } from "@/lib/tenant/resolve";

export default function TenantLivePage({ params }: { params: { tenant: string } }) {
  const tenant = requireTenantFromSlug(params.tenant);
  return <LiveWorkspace tenant={tenant} />;
}

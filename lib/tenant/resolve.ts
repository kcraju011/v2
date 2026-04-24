import { notFound } from "next/navigation";
import { getTenantBySlug, type TenantConfig } from "@/lib/tenant/config";

export function requireTenantFromSlug(slug: string): TenantConfig {
  const tenant = getTenantBySlug(slug);
  if (!tenant) notFound();
  return tenant;
}

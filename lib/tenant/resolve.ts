import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { TENANT_COOKIE, getDefaultTenant, getTenantByGuid, getTenantBySlug, type TenantConfig } from "@/lib/tenant/config";

export function resolveTenantFromQuery(q: string | null | undefined) {
  if (!q) return null;
  return getTenantByGuid(q) ?? getTenantBySlug(q);
}

export function requireTenantFromSlug(slug: string): TenantConfig {
  const tenant = getTenantBySlug(slug);
  if (!tenant) notFound();
  return tenant;
}

export function getTenantFromCookie() {
  const cookieStore = cookies();
  const slug = cookieStore.get(TENANT_COOKIE)?.value;
  return slug ? getTenantBySlug(slug) : null;
}

export function getPreferredTenant() {
  return getTenantFromCookie() ?? getDefaultTenant();
}

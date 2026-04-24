import type { TenantConfig } from "@/lib/tenant/config";
import { createTenantServerClient } from "@/lib/supabase/tenant-client";

export function createClient(tenant: TenantConfig) {
  return createTenantServerClient(tenant);
}

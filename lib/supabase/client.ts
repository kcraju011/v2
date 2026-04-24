"use client";

import type { TenantConfig } from "@/lib/tenant/config";
import { createTenantBrowserClient } from "@/lib/supabase/tenant-client";

export function createClient(tenant: TenantConfig) {
  return createTenantBrowserClient(tenant);
}

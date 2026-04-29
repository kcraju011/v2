import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export function scopeTenantQuery<TQuery extends { eq(column: string, value: string): TQuery }>(
  query: TQuery,
  tenantId: string
) {
  return query.eq("tenant_id", tenantId);
}

export function tenantIdFromMetadata(metadata: Record<string, unknown> | undefined | null) {
  const tenantId = metadata?.tenant_id;
  return typeof tenantId === "string" && tenantId.trim() ? tenantId : null;
}

export function isTenantMatch(metadata: Record<string, unknown> | undefined | null, tenantId: string) {
  return tenantIdFromMetadata(metadata) === tenantId;
}

export function createTenantBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

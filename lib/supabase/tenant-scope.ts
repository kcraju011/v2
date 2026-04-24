import type { SupabaseClient } from "@supabase/supabase-js";
import { type TenantConfig } from "@/lib/tenant/config";

export async function fetchTenantRecord(supabase: SupabaseClient, tenant: TenantConfig) {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenant.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function scopeTable<T extends string>(supabase: SupabaseClient, table: T, tenantId: string) {
  return supabase.from(table).select("*").eq("tenant_id", tenantId);
}

export function enforceTenantFilter<T extends { eq: (column: string, value: string) => T }>(query: T, tenantId: string) {
  return query.eq("tenant_id", tenantId);
}

export async function assertUserBelongsToTenant(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("User does not belong to the requested tenant.");
  }

  return data;
}

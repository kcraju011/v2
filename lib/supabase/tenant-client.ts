import { createBrowserClient } from "@supabase/ssr";
import type { TenantConfig } from "@/lib/tenant/config";

function requireTenantEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing tenant environment variable: ${key}`);
  }
  return value;
}

export function getTenantSupabasePublicConfig(tenant: TenantConfig) {
  return {
    url: requireTenantEnv(tenant.supabaseUrlEnvKey),
    anonKey: requireTenantEnv(tenant.supabaseAnonKeyEnvKey)
  };
}

export function getTenantSupabaseServiceConfig(tenant: TenantConfig) {
  return {
    url: requireTenantEnv(tenant.supabaseUrlEnvKey),
    serviceRoleKey: requireTenantEnv(tenant.supabaseServiceRoleEnvKey)
  };
}

export function createTenantBrowserClient(tenant: TenantConfig) {
  const config = getTenantSupabasePublicConfig(tenant);
  return createBrowserClient(config.url, config.anonKey);
}

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

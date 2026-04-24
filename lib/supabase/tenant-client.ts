import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export function createTenantServerClient(tenant: TenantConfig) {
  const cookieStore = cookies();
  const config = getTenantSupabasePublicConfig(tenant);

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options) {
        cookieStore.set({ name, value: "", ...options });
      }
    }
  });
}

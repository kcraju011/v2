import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { TenantConfig } from "@/lib/tenant/config";
import { getTenantSupabasePublicConfig } from "@/lib/supabase/tenant-client";

export function createClient(tenant: TenantConfig) {
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

export type TenantConfig = {
  id: string;
  guid: string;
  slug: string;
  alias: string;
  name: string;
  city: string;
  logoUrl: string;
  description: string;
  appUrl: string;
  supabaseUrlEnvKey: string;
  supabaseAnonKeyEnvKey: string;
  supabaseServiceRoleEnvKey: string;
};

export const TENANT_COOKIE = "ba_tenant";

export const TENANT_REGISTRY: TenantConfig[] = [
  {
    id: "22222222-2222-2222-2222-222222222222",
    guid: "2",
    slug: "sit",
    alias: "SIT",
    name: "Siddaganga Institute of Technology",
    city: "Tumakuru",
    logoUrl: "https://web.sit.ac.in/wp-content/uploads/2025/03/SIT-Logo-1.png",
    description: "Biometric attendance for students, teachers and employees",
    appUrl: "https://v2-phi-three.vercel.app/t/sit",
    supabaseUrlEnvKey: "NEXT_PUBLIC_SUPABASE_URL_SIT",
    supabaseAnonKeyEnvKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY_SIT",
    supabaseServiceRoleEnvKey: "SUPABASE_SERVICE_ROLE_KEY_SIT"
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    guid: "3",
    slug: "ssit",
    alias: "SSIT",
    name: "Sri Siddhartha Institute of Technology",
    city: "Tumakuru",
    logoUrl: "https://ssit.edu.in/img/ssit-logo.png",
    description: "Biometric attendance for students, teachers and employees",
    appUrl: "https://v2-phi-three.vercel.app/t/ssit",
    supabaseUrlEnvKey: "NEXT_PUBLIC_SUPABASE_URL_SSIT",
    supabaseAnonKeyEnvKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY_SSIT",
    supabaseServiceRoleEnvKey: "SUPABASE_SERVICE_ROLE_KEY_SSIT"
  }
];

export function getDefaultTenant() {
  return TENANT_REGISTRY[0];
}

export function getTenantBySlug(slug: string) {
  return TENANT_REGISTRY.find((tenant) => tenant.slug === String(slug || "").trim().toLowerCase()) ?? null;
}

export function getTenantByGuid(guid: string) {
  return TENANT_REGISTRY.find((tenant) => tenant.guid === String(guid || "").trim()) ?? null;
}

export function getTenantByAlias(alias: string) {
  return TENANT_REGISTRY.find((tenant) => tenant.alias.toLowerCase() === String(alias || "").trim().toLowerCase()) ?? null;
}

export function resolveTenant(value: string) {
  return getTenantBySlug(value) ?? getTenantByGuid(value) ?? getTenantByAlias(value);
}

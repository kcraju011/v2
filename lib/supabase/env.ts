export function requireEnv(value: string, key: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getSupabaseUrl() {
  return requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", "NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return requireEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return requireEnv(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", "SUPABASE_SERVICE_ROLE_KEY");
}

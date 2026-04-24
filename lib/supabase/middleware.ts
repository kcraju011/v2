import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { TENANT_COOKIE, getDefaultTenant, getTenantByGuid, getTenantBySlug } from "@/lib/tenant/config";
import { getTenantSupabasePublicConfig } from "@/lib/supabase/tenant-client";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;
  const qTenant = searchParams.get("q");
  const tenantFromQuery = qTenant ? getTenantByGuid(qTenant) : null;
  const tenantFromCookie = getTenantBySlug(request.cookies.get(TENANT_COOKIE)?.value ?? "");

  const legacyPrefixes = ["/login", "/register", "/dashboard"];
  const isLegacyRoute = legacyPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isRoot = pathname === "/";

  if (tenantFromQuery) {
    const url = request.nextUrl.clone();
    const suffix = isRoot ? "" : pathname;
    url.pathname = `/t/${tenantFromQuery.slug}${suffix}`;
    url.searchParams.delete("q");
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set(TENANT_COOKIE, tenantFromQuery.slug, { path: "/", sameSite: "lax" });
    return redirect;
  }

  if ((isLegacyRoute || isRoot) && tenantFromCookie) {
    const url = request.nextUrl.clone();
    url.pathname = `/t/${tenantFromCookie.slug}${isRoot ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  if (pathname === "/t") {
    const tenant = tenantFromCookie ?? getDefaultTenant();
    const url = request.nextUrl.clone();
    url.pathname = `/t/${tenant.slug}`;
    return NextResponse.redirect(url);
  }

  const tenantMatch = pathname.match(/^\/t\/([^/]+)/);
  if (tenantMatch) {
    const tenant = getTenantBySlug(tenantMatch[1]);
    if (!tenant) {
      const url = request.nextUrl.clone();
      url.pathname = "/404";
      return NextResponse.rewrite(url);
    }
  }

  if (tenantMatch) {
    const tenant = getTenantBySlug(tenantMatch[1]);
    if (tenant) {
      let response = NextResponse.next({ request });
      const tenantConfig = getTenantSupabasePublicConfig(tenant);
      const supabase = createServerClient(tenantConfig.url, tenantConfig.anonKey, {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set(name, value, options) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request });
            response.cookies.set({ name, value, ...options });
          },
          remove(name, options) {
            request.cookies.set({ name, value: "", ...options });
            response = NextResponse.next({ request });
            response.cookies.set({ name, value: "", ...options });
          }
        }
      });

      await supabase.auth.getUser();
      response.cookies.set(TENANT_COOKIE, tenant.slug, { path: "/", sameSite: "lax" });
      response.headers.set("x-bioattend-tenant-id", tenant.id);
      response.headers.set("x-bioattend-tenant-guid", tenant.guid);
      response.headers.set("x-bioattend-tenant-slug", tenant.slug);
      return response;
    }
  }
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/", "/t/:path*", "/dashboard/:path*", "/login", "/register"]
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { TENANT_COOKIE, getDefaultTenant, getTenantByGuid, getTenantBySlug } from "@/lib/tenant/config";
import { getTenantSupabasePublicConfig } from "@/lib/supabase/tenant-client";

function buildTenantPath(tenantSlug: string, pathname: string) {
  if (pathname === "/") return `/t/${tenantSlug}`;
  return `/t/${tenantSlug}${pathname}`;
}

function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/register" || pathname.startsWith("/login/") || pathname.startsWith("/register/");
}

function isDashboardRoute(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function createTenantAwareSupabase(request: NextRequest, response: NextResponse, tenantSlug: string) {
  const tenant = getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const config = getTenantSupabasePublicConfig(tenant);
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: Parameters<typeof response.cookies.set>[2]) {
        response.cookies.set(name, value, options);
      },
      remove(name: string, options?: Parameters<typeof response.cookies.set>[2]) {
        response.cookies.set(name, "", { ...options, maxAge: 0 });
      }
    }
  });

  return { tenant, supabase };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;
  const qTenant = searchParams.get("q");
  const tenantFromQuery = qTenant ? getTenantByGuid(qTenant) : null;
  const tenantFromCookie = getTenantBySlug(request.cookies.get(TENANT_COOKIE)?.value ?? "");

  if (tenantFromQuery) {
    const url = request.nextUrl.clone();
    url.pathname = buildTenantPath(tenantFromQuery.slug, pathname);
    url.searchParams.delete("q");
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set(TENANT_COOKIE, tenantFromQuery.slug, { path: "/", sameSite: "lax" });
    return redirect;
  }

  if (pathname === "/" || isAuthRoute(pathname) || isDashboardRoute(pathname)) {
    const url = request.nextUrl.clone();
    const tenant = tenantFromCookie ?? getDefaultTenant();
    url.pathname = buildTenantPath(tenant.slug, pathname);
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

    const response = NextResponse.next({ request });
    const tenantContext = createTenantAwareSupabase(request, response, tenant.slug);
    if (!tenantContext) {
      return response;
    }

    const { tenant: resolvedTenant, supabase } = tenantContext;
    const { data: { user } } = await supabase.auth.getUser();
    const userTenantId = user?.user_metadata?.tenant_id;
    const isTenantMember = userTenantId === resolvedTenant.id;
    const routeSuffix = pathname.slice(`/t/${resolvedTenant.slug}`.length);
    const isTenantLoginRoute = routeSuffix === "/login" || routeSuffix.startsWith("/login/");
    const isTenantRegisterRoute = routeSuffix === "/register" || routeSuffix.startsWith("/register/");
    const isProtectedTenantRoute = routeSuffix === "" || routeSuffix === "/" || routeSuffix.startsWith("/dashboard");

    response.cookies.set(TENANT_COOKIE, resolvedTenant.slug, { path: "/", sameSite: "lax" });
    response.headers.set("x-bioattend-tenant-id", resolvedTenant.id);
    response.headers.set("x-bioattend-tenant-guid", resolvedTenant.guid);
    response.headers.set("x-bioattend-tenant-slug", resolvedTenant.slug);

    if (!user && isProtectedTenantRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/t/${resolvedTenant.slug}/login`;
      return NextResponse.redirect(loginUrl);
    }

    if (user && !isTenantMember && isProtectedTenantRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/t/${resolvedTenant.slug}/login`;
      return NextResponse.redirect(loginUrl);
    }

    if (user && (isTenantLoginRoute || isTenantRegisterRoute)) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = `/t/${resolvedTenant.slug}/dashboard/teacher`;
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/", "/t/:path*", "/dashboard/:path*", "/login", "/register"]
};

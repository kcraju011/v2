import { NextRequest, NextResponse } from "next/server";

const DEFAULT_TENANT_SLUG = "sit";
const LEGACY_TENANT_MAP: Record<string, string> = {
  "2": "sit",
  "3": "ssit"
};

function buildTenantUrl(request: NextRequest, tenantSlug: string, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/t/${tenantSlug}` : `/t/${tenantSlug}${pathname}`;
  return url;
}

function isLegacyTopLevelRoute(pathname: string) {
  return pathname === "/login" || pathname === "/register" || pathname === "/dashboard" || pathname === "/";
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  if (q && LEGACY_TENANT_MAP[q]) {
    const url = buildTenantUrl(request, LEGACY_TENANT_MAP[q], pathname);
    url.searchParams.delete("q");
    return NextResponse.redirect(url);
  }

  if (pathname === "/t") {
    return NextResponse.redirect(new URL(`/t/${DEFAULT_TENANT_SLUG}`, request.url));
  }

  if (isLegacyTopLevelRoute(pathname)) {
    return NextResponse.redirect(buildTenantUrl(request, DEFAULT_TENANT_SLUG, pathname));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/t/:path*", "/dashboard/:path*", "/login", "/register"]
};

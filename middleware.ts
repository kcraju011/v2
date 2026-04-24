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

function isStaticOrApiPath(pathname: string) {
  return pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".");
}

export function middleware(request: NextRequest) {
  try {
    const { pathname, searchParams } = request.nextUrl;

    if (isStaticOrApiPath(pathname)) {
      return NextResponse.next();
    }

    const q = searchParams.get("q");
    if (q && LEGACY_TENANT_MAP[q]) {
      const url = buildTenantUrl(request, LEGACY_TENANT_MAP[q], pathname);
      url.searchParams.delete("q");
      return NextResponse.redirect(url);
    }

    if (pathname === "/t") {
      return NextResponse.redirect(new URL(`/t/${DEFAULT_TENANT_SLUG}`, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/register"]
};

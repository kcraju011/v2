import { getTenantBySlug } from "@/lib/tenant/config";

function getPathnameFromInput(pathname?: string) {
  if (pathname) return pathname;
  if (typeof window !== "undefined") return window.location.pathname;
  return "";
}

export function getTenantIdFromRoute(pathname?: string) {
  const source = getPathnameFromInput(pathname);
  const match = source.match(/^\/t\/([^/]+)/);
  if (!match) return null;
  return getTenantBySlug(match[1])?.id ?? null;
}

export function getTenantSlugFromRoute(pathname?: string) {
  const source = getPathnameFromInput(pathname);
  const match = source.match(/^\/t\/([^/]+)/);
  return match?.[1] ?? null;
}

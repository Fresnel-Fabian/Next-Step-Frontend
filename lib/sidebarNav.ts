/**
 * Normalize Expo Router paths by removing group segments like (admin) for comparison.
 */
export function normalizeExpoPath(path: string): string {
  const parts = path.split('/').filter(Boolean).filter((seg) => !/^\([^)]+\)$/.test(seg));
  return parts.length ? `/${parts.join('/')}` : '/';
}

export function isSidebarRouteActive(pathname: string, routeHref: string): boolean {
  return normalizeExpoPath(pathname) === normalizeExpoPath(routeHref);
}

/** When not explicitly `'false'`, marketplace routes are disabled and auth chrome is hidden. */
export function isPrelaunchMode(): boolean {
  return import.meta.env.VITE_PRELAUNCH_MODE !== 'false'
}

export const PRELAUNCH_PUBLIC_PATHS = ['/', '/find-support', '/join'] as const

export function isPrelaunchPublicPath(pathname: string): boolean {
  return (PRELAUNCH_PUBLIC_PATHS as readonly string[]).includes(pathname)
}

import type { ReactNode } from 'react'

import { PrelaunchRedirect } from '@/components/prelaunch-redirect'
import { isPrelaunchMode } from '@/lib/prelaunch'

export function prelaunchGuard(element: ReactNode): ReactNode {
  if (isPrelaunchMode()) {
    return <PrelaunchRedirect />
  }
  return element
}

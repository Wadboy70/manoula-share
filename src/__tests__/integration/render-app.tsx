import { type ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { render, type RenderResult } from '@testing-library/react'

import { appRouteObjects } from '@/app-routes'
import { AuthProvider } from '@/features/auth'

export function renderWithApp(
  initialEntries: string[] = ['/'],
  ui: ReactElement | null = null,
): RenderResult {
  if (ui) {
    const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries })
    return render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    )
  }
  const router = createMemoryRouter(appRouteObjects, { initialEntries })
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

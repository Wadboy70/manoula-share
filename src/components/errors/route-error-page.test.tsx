import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createMemoryRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
} from 'react-router-dom'

import { NotFoundTrigger } from '@/components/errors/not-found-trigger'
import { RouteErrorPage } from '@/components/errors/route-error-page'
import { AuthProvider } from '@/features/auth'

function renderWithRouter(initialEntry: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route errorElement={<RouteErrorPage />} element={<Outlet />}>
        <Route path="/" element={<p>Home</p>} />
        <Route path="/missing" element={<NotFoundTrigger />} />
        <Route
          path="/broken"
          element={
            <BrokenRoute />
          }
        />
      </Route>
    ),
    { initialEntries: [initialEntry] },
  )

  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

function BrokenRoute() {
  throw new Error('Test render failure')
}

describe('RouteErrorPage', () => {
  it('renders a 404 message for unknown routes via NotFoundTrigger', () => {
    renderWithRouter('/missing')

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/')
  })

  it('renders a generic error message when a route throws', () => {
    vi.stubEnv('DEV', true)
    renderWithRouter('/broken')

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /something went wrong/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Test render failure')).toBeInTheDocument()
    vi.unstubAllEnvs()
  })
})

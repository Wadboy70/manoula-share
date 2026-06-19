import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { appRouteObjects } from '@/app-routes'
import { AuthProvider } from '@/features/auth'

describe('App routes', () => {
  function renderAt(path: string) {
    const router = createMemoryRouter(appRouteObjects, { initialEntries: [path] })
    return render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    )
  }

  it('renders sign-up page at /signup', () => {
    renderAt('/signup')

    expect(screen.getByText(/create an account/i)).toBeInTheDocument()
  })

  it('renders the 404 error page for unknown paths', () => {
    renderAt('/this-page-does-not-exist')

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/')
  })
})

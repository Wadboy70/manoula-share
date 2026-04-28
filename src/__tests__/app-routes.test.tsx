import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from '@/App'
import { AuthProvider } from '@/features/auth'

describe('App routes', () => {
  it('renders sign-up page at /signup', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/create an account/i)).toBeInTheDocument()
  })

  it('renders sign-up page at /signup/professional', () => {
    render(
      <MemoryRouter initialEntries={['/signup/professional']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/create an account/i)).toBeInTheDocument()
  })
})

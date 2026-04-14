import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from '@/App'

describe('App routes', () => {
  it('renders sign-up page at /signup', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText(/create an account/i)).toBeInTheDocument()
  })
})

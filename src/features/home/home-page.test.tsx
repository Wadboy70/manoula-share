import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { HomePage } from '@/features/home/home-page'

vi.mock('@/lib/prelaunch', () => ({
  isPrelaunchMode: () => true,
  isPrelaunchPublicPath: (pathname: string) =>
    pathname === '/' || pathname === '/find-support' || pathname === '/join',
  PRELAUNCH_PUBLIC_PATHS: ['/', '/find-support', '/join'],
}))

describe('HomePage', () => {
  it('shows hero CTAs for intake routes', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /find support/i })).toHaveAttribute(
      'href',
      '/find-support',
    )
    expect(screen.getByRole('link', { name: /join as a professional/i })).toHaveAttribute(
      'href',
      '/join',
    )
  })

  it('does not render removed marketing sections', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('heading', { name: /our services/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^stories$/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /grow your practice with manoula/i }),
    ).not.toBeInTheDocument()
  })

  it('shows prelaunch how-it-works copy', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    expect(screen.getByText(/share your details/i)).toBeInTheDocument()
    expect(screen.getByText(/we reach out to connect you/i)).toBeInTheDocument()
  })
})

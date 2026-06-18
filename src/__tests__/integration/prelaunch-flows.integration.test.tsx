import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { renderWithApp } from '@/__tests__/integration/render-app'

vi.mock('@/lib/prelaunch', () => ({
  isPrelaunchMode: () => true,
  isPrelaunchPublicPath: (pathname: string) =>
    pathname === '/' || pathname === '/find-support' || pathname === '/join',
  PRELAUNCH_PUBLIC_PATHS: ['/', '/find-support', '/join'],
}))

const authGetSessionMock = vi.hoisted(() =>
  vi.fn(async () => ({ data: { session: null }, error: null })),
)
const authGetUserMock = vi.hoisted(() =>
  vi.fn(async () => ({ data: { user: null }, error: null })),
)
const authOnAuthStateChangeMock = vi.hoisted(() =>
  vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
)

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: authGetSessionMock,
      getUser: authGetUserMock,
      onAuthStateChange: authOnAuthStateChangeMock,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn() },
    storage: { from: vi.fn() },
  },
}))

describe('integration: prelaunch routing', () => {
  beforeEach(() => {
    authGetSessionMock.mockClear()
    authGetUserMock.mockClear()
    authOnAuthStateChangeMock.mockClear()
  })

  it('redirects /search to the landing page', async () => {
    renderWithApp(['/search'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^how it works$/i })).toBeInTheDocument()
    })
    expect(screen.queryByRole('combobox', { name: /specialt/i })).not.toBeInTheDocument()
  })

  it('renders the client intake page at /find-support', async () => {
    renderWithApp(['/find-support'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/what are you looking for/i)).toBeInTheDocument()
  })

  it('renders the professional intake page at /join', async () => {
    renderWithApp(['/join'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /join as a professional/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/location preferences/i)).toBeInTheDocument()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { SignInPage } from '@/pages/sign-in-page'
import type { AppUser } from '@/types/auth'

const signInWithPasswordMock = vi.hoisted(() =>
  vi.fn(
    async (): Promise<{
      data: { user: { id: string } | null }
      error: { message: string } | null
    }> => ({
      data: { user: { id: 'auth-id-1' } },
      error: null,
    }),
  ),
)

const loadAppUserMock = vi.hoisted(() =>
  vi.fn(
    async (): Promise<AppUser | null> => ({
      id: 1,
      created_at: new Date().toISOString(),
      auth_user_id: 'auth-id-1',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      is_professional: false,
      profile_photo_url: null,
      bio: null,
      specialty: null,
      is_profile_complete: false,
      is_searchable: false,
    }),
  ),
)

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
  },
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    loadAppUser: loadAppUserMock,
  }),
}))

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={['/signin']}>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/search" element={<p>Search page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SignInPage', () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset()
    loadAppUserMock.mockReset()
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: 'auth-id-1' } },
      error: null,
    })
    loadAppUserMock.mockResolvedValue({
      id: 1,
      created_at: new Date().toISOString(),
      auth_user_id: 'auth-id-1',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      is_professional: false,
      profile_photo_url: null,
      bio: null,
      specialty: null,
      is_profile_complete: false,
      is_searchable: false,
    })
  })

  it('shows inline validation errors', async () => {
    renderSignIn()
    const form = screen.getByLabelText(/^email$/i).closest('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form!)

    expect(await screen.findByText(/please enter your email/i)).toBeInTheDocument()
    expect(
      screen.getByText(/please enter your password/i),
    ).toBeInTheDocument()
    expect(signInWithPasswordMock).not.toHaveBeenCalled()
  })

  it('redirects clients to /search on successful sign in', async () => {
    const user = userEvent.setup()
    renderSignIn()

    await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password12')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText(/search page/i)).toBeInTheDocument()
    })
    expect(loadAppUserMock).toHaveBeenCalledOnce()
  })

  it('redirects professionals to /dashboard on successful sign in', async () => {
    loadAppUserMock.mockResolvedValue({
      id: 2,
      created_at: new Date().toISOString(),
      auth_user_id: 'auth-id-2',
      first_name: 'Pro',
      last_name: 'User',
      email: 'pro@example.com',
      is_professional: true,
      profile_photo_url: null,
      bio: null,
      specialty: null,
      is_profile_complete: false,
      is_searchable: false,
    })
    const user = userEvent.setup()
    renderSignIn()

    await user.type(screen.getByLabelText(/^email$/i), 'pro@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password12')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText(/dashboard page/i)).toBeInTheDocument()
    })
  })
})

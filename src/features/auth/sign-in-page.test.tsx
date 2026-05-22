import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { SearchPage } from '@/features/search/search-page'
import { SignInPage } from '@/features/auth/sign-in-page'
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

const { baseAppUser, loadAppUserMock } = vi.hoisted(() => {
  const baseAppUser = (): AppUser => ({
    id: 1,
    created_at: new Date().toISOString(),
    auth_user_id: 'auth-id-1',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    is_professional: false,
    profile_photo_url: null,
    bio: null,
    country_code: 'US',
    professionalSearchProfile: null,
  })
  const loadAppUserMock = vi.fn(
    async (): Promise<AppUser | null> => baseAppUser(),
  )
  return { baseAppUser, loadAppUserMock }
})

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
  },
}))

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({
    loadAppUser: loadAppUserMock,
    session: null,
    signOut: vi.fn(),
  }),
}))

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={['/signin']}>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/search" element={<SearchPage />} />
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
    loadAppUserMock.mockResolvedValue(baseAppUser())
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
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })
    expect(loadAppUserMock).toHaveBeenCalledOnce()
  })

  it('shows a friendly message when sign in fails with a network error', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Failed to fetch' },
    })
    const user = userEvent.setup()
    renderSignIn()

    await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password12')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(
      await screen.findByText(
        /couldn't connect.*check your internet connection/i,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument()
  })

  it('shows a friendly message for invalid credentials', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })
    const user = userEvent.setup()
    renderSignIn()

    await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(
      await screen.findByText(/incorrect email or password/i),
    ).toBeInTheDocument()
  })

  it('redirects professionals to /dashboard on successful sign in', async () => {
    loadAppUserMock.mockResolvedValue({
      ...baseAppUser(),
      id: 2,
      auth_user_id: 'auth-id-2',
      first_name: 'Pro',
      last_name: 'User',
      email: 'pro@example.com',
      is_professional: true,
      professionalSearchProfile: null,
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

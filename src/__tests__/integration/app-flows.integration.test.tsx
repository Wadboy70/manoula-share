import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { renderWithApp } from '@/__tests__/integration/render-app'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { SignUpPage } from '@/pages/sign-up-page'
import type { ProfessionalSearchProfileRow, UsersRow } from '@/test/integration/fixtures'
import {
  makeAuthUser,
  makeProfessionalProfileRow,
  makeSearchInvokeCard,
  makeSession,
  makeUsersRow,
} from '@/test/integration/fixtures'

type IntegrationStore = {
  session: Session | null
  usersRow: UsersRow | null
  profileRow: ProfessionalSearchProfileRow | null
}

type IntegrationSupabaseClient = {
  store: IntegrationStore
  auth: {
    getSession: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    resetPasswordForEmail: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
  functions: { invoke: ReturnType<typeof vi.fn> }
  emitAuthStateChange: (event: string, nextSession: Session | null) => void
  resetHandlers: () => void
}

/** Same-file factory so `vi.hoisted` does not hit TDZ on a cross-module import. */
function buildIntegrationSupabaseClient(): IntegrationSupabaseClient {
  let authListener: ((event: string, session: Session | null) => void) | null = null

  const store: IntegrationStore = {
    session: null,
    usersRow: null,
    profileRow: null,
  }

  const emitAuthStateChange = (event: string, nextSession: Session | null) => {
    store.session = nextSession
    authListener?.(event, nextSession)
  }

  const client: IntegrationSupabaseClient = {
    store,
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: store.session },
        error: null,
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(async () => ({ error: null })),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn((cb: (event: string, session: Session | null) => void) => {
        authListener = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    emitAuthStateChange,
    resetHandlers() {
      authListener = null
    },
  }

  client.from.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: store.usersRow, error: null })),
        insert: vi.fn(async () => ({ error: null })),
      }
    }
    if (table === 'professional_search_profiles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: store.profileRow, error: null })),
      }
    }
    throw new Error(`integration mock: unexpected table "${table}"`)
  })

  client.auth.signInWithPassword.mockImplementation(async () => {
    const user = makeAuthUser({
      id: store.usersRow?.auth_user_id ?? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: store.usersRow?.email ?? 'client@example.com',
    })
    const session = makeSession(user)
    store.session = session
    emitAuthStateChange('SIGNED_IN', session)
    return { data: { user }, error: null }
  })

  client.auth.signUp.mockResolvedValue({ error: null })
  client.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
  client.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })
  client.functions.invoke.mockResolvedValue({
    data: { cards: [], nextCursor: null, truncated: false },
    error: null,
  })

  return client
}

const mockSb = vi.hoisted(() => buildIntegrationSupabaseClient())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSb,
}))

function renderForgotPassword() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderResetPassword() {
  return render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderSignUp() {
  const view = render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </MemoryRouter>,
  )
  const card = view.container.querySelector('[data-slot="card"]')
  if (!card) throw new Error('Expected sign-up card root')
  return { ...view, card: card as HTMLElement }
}

describe('integration: routing and search', () => {
  beforeEach(() => {
    mockSb.store.session = null
    mockSb.store.usersRow = null
    mockSb.store.profileRow = null
    mockSb.resetHandlers()
    mockSb.functions.invoke.mockResolvedValue({
      data: { cards: [], nextCursor: null, truncated: false },
      error: null,
    })
  })

  it('allows unauthenticated visitors to open /search', async () => {
    mockSb.store.session = null
    renderWithApp(['/search'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument()
  })

  it('shows search for authenticated non-professional users', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: false })
    mockSb.store.profileRow = null

    renderWithApp(['/search'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })
  })

  it('redirects non-professionals away from /dashboard to /search', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: false })
    mockSb.store.profileRow = null

    renderWithApp(['/dashboard'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })
  })

  it('renders search cards when edge function returns professionals', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: false })
    mockSb.store.profileRow = null
    const card = makeSearchInvokeCard()
    mockSb.functions.invoke.mockResolvedValue({
      data: { cards: [card], nextCursor: null, truncated: false },
      error: null,
    })

    renderWithApp(['/search'])

    await waitFor(() => {
      expect(screen.getByRole('article', { name: /ada nwosu/i })).toBeInTheDocument()
    })
    const searchCard = screen.getByRole('article', { name: /ada nwosu/i })
    expect(
      within(searchCard).getByRole('link', { name: /^view profile$/i }),
    ).toHaveAttribute('href', '/professionals/42')
    expect(screen.getByText('In-person and virtual')).toBeInTheDocument()
  })

  it('signs in as a client and lands on search', async () => {
    mockSb.store.session = null
    mockSb.store.usersRow = makeUsersRow({
      auth_user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: 'client@example.com',
      is_professional: false,
    })
    mockSb.store.profileRow = null

    renderWithApp(['/signin'])
    const u = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    })

    await u.type(screen.getByLabelText(/^email$/i), 'client@example.com')
    await u.type(screen.getByLabelText(/^password$/i), 'password12')
    await u.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })
  })

  it('signs in as a professional and lands on dashboard', async () => {
    mockSb.store.session = null
    mockSb.store.usersRow = makeUsersRow({
      auth_user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: 'pro@example.com',
      is_professional: true,
    })
    mockSb.store.profileRow = makeProfessionalProfileRow({ user_id: 1 })

    renderWithApp(['/signin'])
    const u = userEvent.setup()

    await u.type(screen.getByLabelText(/^email$/i), 'pro@example.com')
    await u.type(screen.getByLabelText(/^password$/i), 'password12')
    await u.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^dashboard$/i })).toBeInTheDocument()
    })
  })

  it('shows the brand header on sign-in and lists auth actions in the desktop menu sheet', async () => {
    mockSb.store.session = null
    renderWithApp(['/signin'])
    const u = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /ma noula/i })).toHaveAttribute('href', '/')
    await u.click(screen.getByRole('button', { name: /open menu/i }))

    const panel = await screen.findByRole('dialog')
    const inPanel = within(panel)
    expect(inPanel.getByRole('link', { name: /^log in$/i })).toHaveAttribute('href', '/signin')
    expect(inPanel.getByRole('link', { name: /^sign up$/i })).toHaveAttribute('href', '/signup')
  })

  it('shows Dashboard in the account sheet when signed in as a professional', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: true })
    mockSb.store.profileRow = makeProfessionalProfileRow({ user_id: 1 })

    renderWithApp(['/search'])
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })

    const u = userEvent.setup()
    await u.click(screen.getByRole('button', { name: /open menu/i }))

    await waitFor(() => {
      const panel = screen.getByRole('dialog')
      expect(within(panel).getByRole('link', { name: /^dashboard$/i })).toHaveAttribute(
        'href',
        '/dashboard',
      )
    })
  })

  it('shows Join as a professional in the account sheet when signed in as a client', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: false })
    mockSb.store.profileRow = null

    renderWithApp(['/search'])
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })

    const u = userEvent.setup()
    await u.click(screen.getByRole('button', { name: /open menu/i }))

    await waitFor(() => {
      const panel = screen.getByRole('dialog')
      expect(
        within(panel).getByRole('link', { name: /join as a professional/i }),
      ).toHaveAttribute('href', '/signup/professional')
    })
  })
})

describe('integration: forgot password', () => {
  beforeEach(() => {
    mockSb.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
  })

  it('shows success after sending reset link', async () => {
    const user = userEvent.setup()
    renderForgotPassword()

    await user.type(screen.getByLabelText(/^email$/i), 'recover@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        /check your email for a password reset link/i,
      )
    })
    expect(mockSb.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'recover@example.com',
      expect.objectContaining({
        redirectTo: expect.stringMatching(/\/reset-password$/),
      }),
    )
  })

  it('shows API error when reset fails', async () => {
    mockSb.auth.resetPasswordForEmail.mockResolvedValueOnce({
      error: { message: 'Rate limited' },
    })
    const user = userEvent.setup()
    renderForgotPassword()

    await user.type(screen.getByLabelText(/^email$/i), 'recover@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/rate limited/i)
  })
})

describe('integration: reset password', () => {
  beforeEach(() => {
    mockSb.auth.updateUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null })
  })

  it('shows validation when passwords do not match', () => {
    renderResetPassword()
    const form = screen.getByLabelText(/^new password$/i).closest('form')
    expect(form).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'password12' },
    })
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), {
      target: { value: 'password99' },
    })
    fireEvent.submit(form!)

    expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i)
    expect(mockSb.auth.updateUser).not.toHaveBeenCalled()
  })

  it('shows success after updating password', async () => {
    const user = userEvent.setup()
    renderResetPassword()

    await user.type(screen.getByLabelText(/^new password$/i), 'password12')
    await user.type(screen.getByLabelText(/^confirm password$/i), 'password12')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/password updated successfully/i)
    })
    expect(mockSb.auth.updateUser).toHaveBeenCalledWith({ password: 'password12' })
  })

  it('shows API error when update fails', async () => {
    mockSb.auth.updateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Session expired' },
    })
    const user = userEvent.setup()
    renderResetPassword()

    await user.type(screen.getByLabelText(/^new password$/i), 'password12')
    await user.type(screen.getByLabelText(/^confirm password$/i), 'password12')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/session expired/i)
  })
})

describe('integration: sign up', () => {
  beforeEach(() => {
    mockSb.auth.signUp.mockResolvedValue({ error: null })
  })

  it('submits sign up and shows email confirmation message', async () => {
    const user = userEvent.setup()
    const { card } = renderSignUp()
    const scope = within(card)

    await user.type(scope.getByLabelText(/^first name$/i), 'Jane')
    await user.type(scope.getByLabelText(/^email$/i), 'jane@example.com')
    await user.type(scope.getByLabelText(/^password$/i), 'password12')
    await user.click(scope.getByRole('button', { name: /^create account$/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        /check your email to confirm your account before signing in/i,
      )
    })
    expect(mockSb.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane@example.com',
        password: 'password12',
        options: expect.objectContaining({
          data: expect.objectContaining({ first_name: 'Jane' }),
        }),
      }),
    )
  })
})

import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { renderWithApp } from '@/__tests__/integration/render-app'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { SignUpPage } from '@/pages/sign-up-page'
import type {
  ProfessionalCredentialRow,
  ServiceAreaPlaceRow,
  ServiceProviderLocationRow,
  ServiceRow,
  ProfessionalSearchProfileRow,
  UsersRow,
} from '@/test/integration/fixtures'
import {
  makeAuthUser,
  makeProfessionalCredentialRow,
  makeProfessionalProfileRow,
  makeServiceAreaPlaceRow,
  makeServiceProviderLocationRow,
  makeServiceRow,
  makeSearchInvokeCard,
  makeSession,
  makeUsersRow,
} from '@/test/integration/fixtures'

type IntegrationStore = {
  session: Session | null
  usersRow: UsersRow | null
  profileRow: ProfessionalSearchProfileRow | null
  credentialRows: ProfessionalCredentialRow[]
  serviceRows: ServiceRow[]
  serviceProviderLocationRows: ServiceProviderLocationRow[]
  serviceAreaPlaceRows: ServiceAreaPlaceRow[]
  specialtyRows: { specialty_id: number }[]
  specialties: { id: number; label: string }[]
}

type IntegrationSupabaseClient = {
  store: IntegrationStore
  auth: {
    getSession: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    resetPasswordForEmail: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
  functions: { invoke: ReturnType<typeof vi.fn> }
  storage: { from: ReturnType<typeof vi.fn> }
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
    credentialRows: [],
    serviceRows: [],
    serviceProviderLocationRows: [],
    serviceAreaPlaceRows: [],
    specialtyRows: [],
    specialties: [
      { id: 1, label: 'Lactation Consultant' },
      { id: 2, label: 'Doula' },
      { id: 3, label: 'Therapist' },
    ],
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
      getUser: vi.fn(async () => ({
        data: { user: store.session?.user ?? null },
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
    storage: { from: vi.fn() },
    emitAuthStateChange,
    resetHandlers() {
      authListener = null
    },
  }

  client.from.mockImplementation((table: string) => {
    if (table === 'professional_search_profiles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: store.profileRow, error: null })),
        single: vi.fn(async () => ({ data: store.profileRow, error: null })),
        update: vi.fn((patch: Partial<ProfessionalSearchProfileRow>) => ({
          eq: vi.fn(async () => {
            store.profileRow = { ...(store.profileRow as ProfessionalSearchProfileRow), ...patch }
            return { error: null }
          }),
        })),
      }
    }
    if (table === 'professional_specialties') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn(async () => ({ data: store.specialtyRows, error: null })),
        delete: vi.fn(() => ({
          eq: vi.fn(async () => {
            store.specialtyRows = []
            return { error: null }
          }),
        })),
        insert: vi.fn(async (rows: { professional_id: number; specialty_id: number }[]) => {
          store.specialtyRows = rows.map((row) => ({ specialty_id: row.specialty_id }))
          return { error: null }
        }),
      }
    }
    if (table === 'specialties') {
      return {
        select: vi.fn(() => ({
          in: vi.fn((_: string, ids: number[]) => ({
            order: vi.fn(async () => ({
              data: store.specialties.filter((row) => ids.includes(row.id)),
              error: null,
            })),
          })),
          order: vi.fn(async () => ({ data: store.specialties, error: null })),
        })),
      }
    }
    if (table === 'professional_credentials') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(async () => ({ data: store.credentialRows, error: null })),
        in: vi.fn(async (_: string, ids: number[]) => {
          store.credentialRows = store.credentialRows.filter((row) => !ids.includes(row.id))
          return { error: null }
        }),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(async (_: string, ids: number[]) => {
              store.credentialRows = store.credentialRows.filter((row) => !ids.includes(row.id))
              return { error: null }
            }),
          })),
        })),
        update: vi.fn((patch: Partial<ProfessionalCredentialRow>) => ({
          eq: vi.fn((_: string, id: number) => ({
            eq: vi.fn(async () => {
              store.credentialRows = store.credentialRows.map((row) =>
                row.id === id ? { ...row, ...patch } : row,
              )
              return { error: null }
            }),
          })),
        })),
        insert: vi.fn(async (row: Partial<ProfessionalCredentialRow>) => {
          const nextId = Math.max(0, ...store.credentialRows.map((item) => item.id)) + 1
          store.credentialRows = [
            ...store.credentialRows,
            makeProfessionalCredentialRow({
              id: nextId,
              credential_type: row.credential_type ?? 'IBCLC',
              credential_label: row.credential_label ?? 'IBCLC',
              issuing_body: row.issuing_body ?? 'IBLCE',
              registration_number: row.registration_number ?? null,
            }),
          ]
          return { error: null }
        }),
      }
    }
    if (table === 'users') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: store.usersRow, error: null })),
        single: vi.fn(async () => ({
          data: store.usersRow
            ? {
                first_name: store.usersRow.first_name,
                last_name: store.usersRow.last_name,
                bio: store.usersRow.bio,
                profile_photo_url: store.usersRow.profile_photo_url,
                country_code: store.usersRow.country_code,
              }
            : null,
          error: null,
        })),
        update: vi.fn((patch: Partial<UsersRow>) => ({
          eq: vi.fn(async () => {
            store.usersRow = { ...(store.usersRow as UsersRow), ...patch }
            return { error: null }
          }),
        })),
        insert: vi.fn(async () => ({ error: null })),
      }
    }
    if (table === 'services') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(async () => ({ data: store.serviceRows, error: null })),
        update: vi.fn((patch: Partial<ServiceRow>) => ({
          eq: vi.fn((_: string, id: number) => ({
            eq: vi.fn(async () => {
              store.serviceRows = store.serviceRows.map((row) => (row.id === id ? { ...row, ...patch } : row))
              return { error: null }
            }),
          })),
        })),
        insert: vi.fn((row: Partial<ServiceRow>) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              const nextId = Math.max(0, ...store.serviceRows.map((item) => item.id)) + 1
              store.serviceRows = [
                makeServiceRow({
                  id: nextId,
                  title: row.title ?? 'New service',
                  description: row.description ?? null,
                  delivery_mode: row.delivery_mode ?? 'remote',
                  professional_id: row.professional_id ?? 1,
                  price_cents: row.price_cents ?? null,
                  currency_code: row.currency_code ?? 'GBP',
                  duration_minutes: row.duration_minutes ?? null,
                  specialty_id: row.specialty_id ?? null,
                  remote_scope: row.remote_scope ?? null,
                  provider_location_name: row.provider_location_name ?? null,
                  service_area_type: row.service_area_type ?? null,
                  service_radius_km: row.service_radius_km ?? null,
                  service_area_text: row.service_area_text ?? null,
                  is_active: row.is_active ?? true,
                }),
                ...store.serviceRows,
              ]
              return { data: { id: nextId }, error: null }
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn((_: string, id: number) => ({
            eq: vi.fn(async () => {
              store.serviceRows = store.serviceRows.filter((row) => row.id !== id)
              store.serviceProviderLocationRows = store.serviceProviderLocationRows.filter(
                (row) => row.service_id !== id,
              )
              store.serviceAreaPlaceRows = store.serviceAreaPlaceRows.filter((row) => row.service_id !== id)
              return { error: null }
            }),
          })),
        })),
      }
    }
    if (table === 'service_provider_locations') {
      return {
        select: vi.fn(() => ({
          in: vi.fn((_: string, ids: number[]) => ({
            order: vi.fn(async () => ({
              data: store.serviceProviderLocationRows.filter((row) => ids.includes(row.service_id)),
              error: null,
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async (_: string, serviceId: number) => {
            store.serviceProviderLocationRows = store.serviceProviderLocationRows.filter(
              (row) => row.service_id !== serviceId,
            )
            return { error: null }
          }),
        })),
        insert: vi.fn(async (rows: Partial<ServiceProviderLocationRow>[]) => {
          const nextRows = rows.map((row, idx) =>
            makeServiceProviderLocationRow({
              id: Math.max(0, ...store.serviceProviderLocationRows.map((item) => item.id)) + idx + 1,
              service_id: row.service_id ?? 1,
              location_name: row.location_name ?? null,
              location_label: row.location_label ?? null,
              mapbox_id: row.mapbox_id ?? null,
              latitude: row.latitude ?? null,
              longitude: row.longitude ?? null,
              geocoded_at: row.geocoded_at ?? null,
              country_code: row.country_code ?? 'GB',
            }),
          )
          store.serviceProviderLocationRows = [...store.serviceProviderLocationRows, ...nextRows]
          return { error: null }
        }),
      }
    }
    if (table === 'service_area_places') {
      return {
        select: vi.fn(() => ({
          in: vi.fn((_: string, ids: number[]) => ({
            order: vi.fn(async () => ({
              data: store.serviceAreaPlaceRows.filter((row) => ids.includes(row.service_id)),
              error: null,
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async (_: string, serviceId: number) => {
            store.serviceAreaPlaceRows = store.serviceAreaPlaceRows.filter((row) => row.service_id !== serviceId)
            return { error: null }
          }),
        })),
        insert: vi.fn(async (rows: Partial<ServiceAreaPlaceRow>[]) => {
          const nextRows = rows.map((row, idx) =>
            makeServiceAreaPlaceRow({
              id: Math.max(0, ...store.serviceAreaPlaceRows.map((item) => item.id)) + idx + 1,
              service_id: row.service_id ?? 1,
              location_label: row.location_label ?? null,
              mapbox_id: row.mapbox_id ?? null,
              latitude: row.latitude ?? null,
              longitude: row.longitude ?? null,
              geocoded_at: row.geocoded_at ?? null,
              country_code: row.country_code ?? 'GB',
            }),
          )
          store.serviceAreaPlaceRows = [...store.serviceAreaPlaceRows, ...nextRows]
          return { error: null }
        }),
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
  client.storage.from.mockReturnValue({
    upload: vi.fn(async () => ({ error: null })),
    getPublicUrl: vi.fn(() => ({
      data: { publicUrl: 'https://example.com/profile-photo.jpg' },
    })),
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
    mockSb.store.credentialRows = []
    mockSb.store.serviceRows = []
    mockSb.store.serviceProviderLocationRows = []
    mockSb.store.serviceAreaPlaceRows = []
    mockSb.store.specialtyRows = []
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

  it('shows completion prompt on dashboard when professional profile is incomplete', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: true })
    mockSb.store.profileRow = makeProfessionalProfileRow({
      user_id: 1,
      is_profile_complete: false,
    })

    renderWithApp(['/dashboard'])

    await waitFor(() => {
      expect(screen.getByText(/complete your profile/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /finish profile/i })).toHaveAttribute(
      'href',
      '/dashboard/profile',
    )
  })

  it('saves professional profile edits and keeps script tags inert in preview text', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: true })
    mockSb.store.profileRow = makeProfessionalProfileRow({
      user_id: 1,
      is_profile_complete: false,
      location_label: '',
      is_public_searchable: false,
    })
    mockSb.store.credentialRows = [makeProfessionalCredentialRow()]
    mockSb.store.specialtyRows = [{ specialty_id: 1 }]

    renderWithApp(['/dashboard/profile'])
    const u = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument()
    })

    await u.clear(screen.getByLabelText(/first name/i))
    await u.type(screen.getByLabelText(/first name/i), 'Jane')
    await u.clear(screen.getByLabelText(/last name/i))
    await u.type(screen.getByLabelText(/last name/i), 'Doula')
    await u.clear(screen.getByLabelText(/bio \/ about/i))
    await u.type(screen.getByLabelText(/bio \/ about/i), '<script>alert(1)</script>Supportive care')
    await u.clear(screen.getByLabelText(/location/i))
    await u.type(screen.getByLabelText(/location/i), 'London')
    await u.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/profile saved successfully/i)
    })
    expect(screen.queryByText(/<script>/i)).not.toBeInTheDocument()
  })

  it('allows professionals to create update and delete services', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: true })
    mockSb.store.profileRow = makeProfessionalProfileRow({ user_id: 1 })

    renderWithApp(['/dashboard/services'])
    const u = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^services$/i })).toBeInTheDocument()
    })

    await u.click(screen.getByRole('button', { name: /^create service$/i }))
    expect(screen.getByLabelText(/^price \(gbp\)$/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^currency$/i)).not.toBeInTheDocument()
    expect(screen.getByText(/delivery mode determines which location fields/i)).toBeInTheDocument()

    await u.type(screen.getByLabelText(/^title$/i), 'Virtual support call')
    await u.type(screen.getByLabelText(/^price \(gbp\)$/i), '75.50')
    await u.selectOptions(screen.getByLabelText(/^delivery mode$/i), 'remote')
    await u.click(screen.getAllByRole('button', { name: /^create service$/i })[1]!)

    await waitFor(() => {
      expect(mockSb.store.serviceRows.some((row) => row.title === 'Virtual support call')).toBe(true)
    })
    expect(mockSb.store.serviceRows.some((row) => row.title === 'Virtual support call' && row.price_cents === 7550)).toBe(true)

    const created = mockSb.store.serviceRows.find((row) => row.title === 'Virtual support call')
    expect(created).toBeTruthy()
    await u.click(screen.getByRole('button', { name: /virtual support call/i }))
    expect(screen.getByRole('button', { name: /^save changes$/i })).toBeInTheDocument()

    await u.selectOptions(screen.getByLabelText(/^delivery mode$/i), 'in_home')
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /custom text/i })).not.toBeInTheDocument()
    })
    expect(screen.queryByLabelText(/^radius \(km\)$/i)).not.toBeInTheDocument()
    await u.selectOptions(screen.getByLabelText(/^service area type$/i), 'radius')
    expect(screen.getByLabelText(/^radius \(km\)$/i)).toBeInTheDocument()

    await u.clear(screen.getByLabelText(/^title$/i))
    await u.type(screen.getByLabelText(/^title$/i), 'Virtual support call updated')
    await u.click(screen.getByRole('button', { name: /^save changes$/i }))

    await waitFor(() => {
      expect(mockSb.store.serviceRows.some((row) => row.title === 'Virtual support call updated')).toBe(true)
    })

    await u.click(screen.getByRole('button', { name: /virtual support call updated/i }))
    await u.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => {
      expect(mockSb.store.serviceRows.some((row) => row.title === 'Virtual support call updated')).toBe(false)
    })
    confirmSpy.mockRestore()
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

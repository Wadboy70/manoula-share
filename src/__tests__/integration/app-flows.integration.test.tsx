import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { renderWithApp } from '@/__tests__/integration/render-app'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { SignUpPage } from '@/pages/sign-up-page'
import { AuthProvider } from '@/features/auth'
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
  makeAvailabilityExceptionRow,
  makeAvailabilityRuleRow,
  makeBookingListRow,
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
  bookingRows: ReturnType<typeof makeBookingListRow>[]
  availabilityRuleRows: ReturnType<typeof makeAvailabilityRuleRow>[]
  availabilityExceptionRows: ReturnType<typeof makeAvailabilityExceptionRow>[]
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
  rpc: ReturnType<typeof vi.fn>
  channel: ReturnType<typeof vi.fn>
  removeChannel: ReturnType<typeof vi.fn>
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
    bookingRows: [],
    availabilityRuleRows: [],
    availabilityExceptionRows: [],
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
    rpc: vi.fn(async (fn: string, args?: { p_booking_id?: number; p_status?: string }) => {
      if (fn === 'ensure_messaging_conversation') {
        return { data: 100, error: null }
      }
      if (fn === 'update_booking_status') {
        const bookingId = args?.p_booking_id
        const status = args?.p_status
        const row = store.bookingRows.find((b) => b.id === bookingId)
        if (row && status) {
          row.status = status as typeof row.status
          row.updated_at = new Date().toISOString()
        }
        return { data: null, error: null }
      }
      if (fn === 'list_admin_intake_leads') {
        if (!store.usersRow?.is_admin) {
          return { data: { ok: false, error: 'Forbidden' }, error: null }
        }
        return {
          data: {
            ok: true,
            mothers: [
              {
                id: 10,
                first_name: 'Lead',
                last_name: 'Mother',
                email: 'mother@example.com',
                lead_status: 'prelaunch',
                intake_submitted_at: '2026-06-20T10:00:00.000Z',
                location_label: 'London, UK',
                specialty_labels: ['Lactation support'],
                looking_for_details: 'Evening help',
              },
            ],
            professionals: [],
          },
          error: null,
        }
      }
      return { data: null, error: { message: `unknown rpc ${fn}` } }
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => 'mock-realtime'),
    })),
    removeChannel: vi.fn(),
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
            if (patch.is_professional === true && !store.profileRow) {
              store.profileRow = makeProfessionalProfileRow({
                user_id: store.usersRow.id,
                is_profile_complete: false,
                is_public_searchable: true,
                is_approved: false,
              })
            }
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
              place_id: row.place_id ?? null,
              ancestor_place_ids: row.ancestor_place_ids ?? [],
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
              place_id: row.place_id ?? null,
              ancestor_place_ids: row.ancestor_place_ids ?? [],
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
    if (table === 'bookings') {
      return {
        select: vi.fn(() => {
          let column: 'professional_id' | 'client_id' = 'client_id'
          let value = 0
          let statuses: string[] = []
          let requireScheduled = false

          const builder = {
            eq: vi.fn((col: 'professional_id' | 'client_id', val: number) => {
              column = col
              value = val
              return builder
            }),
            in: vi.fn((_col: string, statusList: string[]) => {
              statuses = statusList
              return builder
            }),
            not: vi.fn((col: string, op: string, val: null) => {
              if (col === 'scheduled_at' && op === 'is' && val === null) {
                requireScheduled = true
              }
              return builder
            }),
            order: vi.fn(() => builder),
            then(
              resolve: (result: { data: unknown; error: null }) => void,
              reject?: (reason: unknown) => void,
            ) {
              try {
                let filtered = store.bookingRows.filter(
                  (b) => b[column] === value && (statuses.length === 0 || statuses.includes(b.status)),
                )
                if (requireScheduled) {
                  filtered = filtered.filter((b) => b.scheduled_at != null)
                }
                resolve({ data: filtered, error: null })
              } catch (err) {
                reject?.(err)
              }
            },
          }

          return builder
        }),
      }
    }
    if (table === 'professional_availability_rules') {
      const listBuilder = {
        eq: vi.fn(() => listBuilder),
        order: vi.fn(() => listBuilder),
        then(
          resolve: (result: { data: unknown; error: null }) => void,
          reject?: (reason: unknown) => void,
        ) {
          try {
            resolve({ data: store.availabilityRuleRows, error: null })
          } catch (err) {
            reject?.(err)
          }
        },
      }

      return {
        select: vi.fn(() => listBuilder),
        insert: vi.fn((row: Partial<ReturnType<typeof makeAvailabilityRuleRow>>) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              const nextId = Math.max(0, ...store.availabilityRuleRows.map((item) => item.id)) + 1
              const created = makeAvailabilityRuleRow({
                id: nextId,
                professional_id: row.professional_id ?? 1,
                day_of_week: row.day_of_week ?? 1,
                start_time: row.start_time ?? '09:00:00',
                end_time: row.end_time ?? '17:00:00',
              })
              store.availabilityRuleRows = [...store.availabilityRuleRows, created]
              return { data: created, error: null }
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async (_: string, id: number) => {
            store.availabilityRuleRows = store.availabilityRuleRows.filter((row) => row.id !== id)
            return { error: null }
          }),
        })),
      }
    }
    if (table === 'professional_availability_exceptions') {
      const listBuilder = {
        eq: vi.fn(() => listBuilder),
        order: vi.fn(() => listBuilder),
        then(
          resolve: (result: { data: unknown; error: null }) => void,
          reject?: (reason: unknown) => void,
        ) {
          try {
            resolve({ data: store.availabilityExceptionRows, error: null })
          } catch (err) {
            reject?.(err)
          }
        },
      }

      return {
        select: vi.fn(() => listBuilder),
        insert: vi.fn((row: Partial<ReturnType<typeof makeAvailabilityExceptionRow>>) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              const nextId =
                Math.max(0, ...store.availabilityExceptionRows.map((item) => item.id)) + 1
              const created = makeAvailabilityExceptionRow({
                id: nextId,
                professional_id: row.professional_id ?? 1,
                exception_date: row.exception_date ?? '2026-12-25',
                kind: row.kind ?? 'unavailable',
                start_time: row.start_time ?? null,
                end_time: row.end_time ?? null,
              })
              store.availabilityExceptionRows = [...store.availabilityExceptionRows, created]
              return { data: created, error: null }
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async (_: string, id: number) => {
            store.availabilityExceptionRows = store.availabilityExceptionRows.filter(
              (row) => row.id !== id,
            )
            return { error: null }
          }),
        })),
      }
    }
    if (table === 'conversations') {
      return {
        select: vi.fn(() => ({
          order: vi.fn(async () => ({ data: [], error: null })),
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      }
    }
    if (table === 'messages') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(async () => ({ data: [], error: null })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: 1,
                conversation_id: 1,
                sender_id: 1,
                body: 'hello',
                created_at: new Date().toISOString(),
              },
              error: null,
            })),
          })),
        })),
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
  client.functions.invoke.mockImplementation(async (functionName: string) => {
    if (functionName === 'location') {
      return {
        data: {
          suggestions: [
            {
              id: 'integration-test-place',
              label: 'London, UK',
              placeId: 'place.integration',
              latitude: 51.5074,
              longitude: -0.1278,
              countryCode: 'GB',
              ancestorPlaceIds: [],
            },
          ],
        },
        error: null,
      }
    }
    return { data: { cards: [], nextCursor: null, truncated: false }, error: null }
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
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </AuthProvider>
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
    mockSb.store.bookingRows = []
    mockSb.resetHandlers()
    mockSb.functions.invoke.mockImplementation(async (functionName: string) => {
      if (functionName === 'location') {
        return {
          data: {
            suggestions: [
              {
                id: 'integration-test-place',
                label: 'London, UK',
                placeId: 'place.integration',
                latitude: 51.5074,
                longitude: -0.1278,
                countryCode: 'GB',
                ancestorPlaceIds: [],
              },
            ],
          },
          error: null,
        }
      }
      return { data: { cards: [], nextCursor: null, truncated: false }, error: null }
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

  it('renders messages inbox for signed-in client', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: false })
    mockSb.store.profileRow = null

    renderWithApp(['/messages'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^messages$/i })).toBeInTheDocument()
    })
    expect(await screen.findByText(/no conversations yet/i)).toBeInTheDocument()
  })

  it('shows client bookings and pending status', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ id: 2, is_professional: false })
    mockSb.store.bookingRows = [
      makeBookingListRow({
        id: 1,
        client_id: 2,
        professional_id: 1,
        status: 'pending',
      }),
    ]

    renderWithApp(['/bookings'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^my bookings$/i })).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Sam Pro')).toBeInTheDocument()
    })
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Pending')
    expect(screen.queryByRole('button', { name: /^accept$/i })).not.toBeInTheDocument()
  })

  it('professional accepts booking from dashboard bookings page', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ id: 1, is_professional: true })
    mockSb.store.profileRow = makeProfessionalProfileRow({ user_id: 1 })
    mockSb.store.bookingRows = [
      makeBookingListRow({
        id: 1,
        client_id: 2,
        professional_id: 1,
        status: 'pending',
      }),
    ]

    renderWithApp(['/dashboard/bookings'])
    const u = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^bookings$/i })).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument()
    })
    await u.click(screen.getByRole('button', { name: /^accept$/i }))

    await waitFor(() => {
      expect(mockSb.store.bookingRows[0]?.status).toBe('accepted')
    })
    await u.click(screen.getByRole('tab', { name: /^upcoming/i }))
    expect(screen.getByText('Alex Client')).toBeInTheDocument()
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
    mockSb.functions.invoke.mockImplementation(async (functionName: string) => {
      if (functionName === 'search-cards') {
        return { data: { cards: [card], nextCursor: null, truncated: false }, error: null }
      }
      if (functionName === 'location') {
        return {
          data: {
            suggestions: [
              {
                id: 'integration-test-place',
                label: 'London, UK',
                placeId: 'place.integration',
                latitude: 51.5074,
                longitude: -0.1278,
                countryCode: 'GB',
                ancestorPlaceIds: [],
              },
            ],
          },
          error: null,
        }
      }
      return { data: { cards: [], nextCursor: null, truncated: false }, error: null }
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
      '/professional/onboarding',
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

    mockSb.functions.invoke.mockImplementation(async (fnName: string) => {
      if (fnName === 'location') {
        return {
          data: {
            suggestions: [
              {
                id: 'london-1',
                label: 'London, UK',
                placeId: 'place.integration-test',
                latitude: 51.5074,
                longitude: -0.1278,
                countryCode: 'GB',
                ancestorPlaceIds: [],
              },
            ],
          },
          error: null,
        }
      }
      return {
        data: { cards: [], nextCursor: null, truncated: false },
        error: null,
      }
    })

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
    await u.type(screen.getByLabelText(/location/i), 'Lon')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /london, uk/i })).toBeInTheDocument()
    })
    await u.click(screen.getByRole('option', { name: /london, uk/i }))
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

  it('allows professionals to manage availability rules and exceptions', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ id: 1, is_professional: true })
    mockSb.store.profileRow = makeProfessionalProfileRow({ user_id: 1 })

    renderWithApp(['/dashboard/availability'])
    const u = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^availability$/i })).toBeInTheDocument()
    })

    await u.click(screen.getByRole('button', { name: /^add window$/i }))

    await waitFor(() => {
      expect(mockSb.store.availabilityRuleRows).toHaveLength(1)
    })
    expect(screen.getByText(/monday ·/i)).toBeInTheDocument()

    const dateInput = screen.getByLabelText(/^date$/i)
    await u.clear(dateInput)
    await u.type(dateInput, '2026-12-25')
    await u.click(screen.getByRole('button', { name: /^add exception$/i }))

    await waitFor(() => {
      expect(mockSb.store.availabilityExceptionRows).toHaveLength(1)
    })
    expect(screen.getByText(/unavailable \(all day\)/i)).toBeInTheDocument()
  })

  it('shows requested time on client bookings when scheduled', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ id: 2, is_professional: false })
    mockSb.store.bookingRows = [
      makeBookingListRow({
        id: 1,
        client_id: 2,
        professional_id: 1,
        status: 'pending',
        scheduled_at: '2026-06-10T10:00:00.000Z',
      }),
    ]

    renderWithApp(['/bookings'])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^my bookings$/i })).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText(/requested:/i)).toBeInTheDocument()
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
      ).toHaveAttribute('href', '/professional/onboarding')
    })
  })

  it('shows Continue setup for incomplete professionals', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_professional: true })
    mockSb.store.profileRow = makeProfessionalProfileRow({
      user_id: 1,
      is_profile_complete: false,
    })

    renderWithApp(['/search'])
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^find support$/i })).toBeInTheDocument()
    })

    const u = userEvent.setup()
    await u.click(screen.getByRole('button', { name: /open menu/i }))

    await waitFor(() => {
      const panel = screen.getByRole('dialog')
      expect(within(panel).getByRole('link', { name: /continue setup/i })).toHaveAttribute(
        'href',
        '/professional/onboarding',
      )
    })
  })

  it('promotes a client to professional after the onboarding name step', async () => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({
      is_professional: false,
      first_name: '',
      last_name: '',
    })
    mockSb.store.profileRow = null

    renderWithApp(['/professional/onboarding'])
    const u = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByText(/^your name$/i)).toBeInTheDocument()
    })

    await u.type(screen.getByLabelText(/^first name$/i), 'Pro')
    await u.type(screen.getByLabelText(/^last name$/i), 'Fessional')
    await u.click(screen.getByRole('button', { name: /^continue$/i }))

    await waitFor(() => {
      expect(mockSb.store.usersRow?.is_professional).toBe(true)
      expect(mockSb.store.usersRow?.first_name).toBe('Pro')
      expect(mockSb.store.usersRow?.last_name).toBe('Fessional')
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
    mockSb.store.session = null
    mockSb.store.usersRow = null
    mockSb.store.profileRow = null
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

describe('integration: admin intake leads', () => {
  beforeEach(() => {
    const user = makeAuthUser()
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({ is_admin: false, is_professional: false })
    mockSb.store.profileRow = null
  })

  it('redirects non-admin users away from /admin', async () => {
    renderWithApp(['/admin'])

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /intake leads/i })).not.toBeInTheDocument()
    })
  })

  it('lets admins view intake leads on /admin', async () => {
    const user = makeAuthUser({ email: 'admin@example.com' })
    mockSb.store.session = makeSession(user)
    mockSb.store.usersRow = makeUsersRow({
      is_admin: true,
      is_professional: false,
      auth_user_id: user.id,
      email: 'admin@example.com',
    })

    renderWithApp(['/admin'])

    expect(await screen.findByRole('heading', { name: /intake leads/i })).toBeInTheDocument()
    expect(await screen.findByText('mother@example.com')).toBeInTheDocument()
    expect(mockSb.rpc).toHaveBeenCalledWith('list_admin_intake_leads')
  })
})

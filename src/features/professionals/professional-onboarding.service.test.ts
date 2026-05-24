import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import { saveOnboardingNameStep } from './professional-onboarding.service'

describe('saveOnboardingNameStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-1' } },
      error: null,
    })
  })

  it('validates required names', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 9 }, error: null }),
        }
      }
      return {}
    })

    const result = await saveOnboardingNameStep({ firstName: 'Jane', lastName: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/last name/i)
    }
  })

  it('promotes the user to professional when names are saved', async () => {
    const usersUpdate = vi.fn((patch: Record<string, unknown>) => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }))
    const profileUpdate = vi.fn((patch: Record<string, unknown>) => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }))

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 9,
              first_name: 'Jane',
              last_name: 'Doe',
              bio: null,
              profile_photo_url: null,
              country_code: 'GB',
              is_professional: true,
            },
            error: null,
          }),
          update: usersUpdate,
        }
      }
      if (table === 'professional_search_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              location_label: null,
              place_id: null,
              latitude: null,
              longitude: null,
              geocoded_at: null,
              country_code: 'GB',
              is_public_searchable: true,
              is_profile_complete: false,
            },
            error: null,
          }),
          update: profileUpdate,
        }
      }
      if (table === 'professional_specialties') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      if (table === 'professional_credentials') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      return {}
    })

    const result = await saveOnboardingNameStep({ firstName: 'Jane', lastName: 'Doe' })
    expect(result.ok).toBe(true)
    expect(usersUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Jane',
        last_name: 'Doe',
        is_professional: true,
      }),
    )
    expect(profileUpdate).toHaveBeenCalledWith({ is_public_searchable: true })
  })
})

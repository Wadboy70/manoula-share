import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CAPTCHA_REQUIRED_ERROR } from '@/features/captcha/captcha-config'
import { submitClientIntake } from '@/features/intake/intake.service'
import type { ClientIntakeFormValues } from '@/features/intake/intake-validation'

const invokeMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}))

const validValues: ClientIntakeFormValues = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  specialtyIds: [2],
  somethingElseSelected: false,
  locationLabel: 'London, UK',
  placeId: 'place.london',
  latitude: 51.5,
  longitude: -0.12,
  geocodedAt: null,
  countryCode: 'GB',
  lookingForDetails: 'Need evening virtual sessions.',
}

describe('submitClientIntake', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null })
    vi.stubEnv('VITE_CAPTCHA_ENABLED', 'false')
    vi.stubEnv('VITE_CAPTCHA_SITE_KEY', '')
  })

  it('calls submit-intake with normalized payload', async () => {
    const result = await submitClientIntake(validValues)

    expect(result).toEqual({ ok: true })
    expect(invokeMock).toHaveBeenCalledWith('submit-intake', {
      body: {
        kind: 'client',
        payload: expect.objectContaining({
          email: 'jane@example.com',
          looking_for_details: 'Need evening virtual sessions.',
          specialty_ids: [2],
        }),
      },
    })
  })

  it('submits empty specialty_ids when Something else is selected', async () => {
    const result = await submitClientIntake({
      ...validValues,
      specialtyIds: [],
      somethingElseSelected: true,
      lookingForDetails: '',
    })

    expect(result).toEqual({ ok: true })
    expect(invokeMock).toHaveBeenCalledWith('submit-intake', {
      body: {
        kind: 'client',
        payload: expect.objectContaining({
          specialty_ids: [],
          looking_for_details: '',
        }),
      },
    })
  })

  it('passes captchaToken when captcha is enabled', async () => {
    vi.stubEnv('VITE_CAPTCHA_ENABLED', 'true')
    vi.stubEnv('VITE_CAPTCHA_SITE_KEY', 'test-site-key')

    const result = await submitClientIntake(validValues, 'captcha-token-123')

    expect(result).toEqual({ ok: true })
    expect(invokeMock).toHaveBeenCalledWith('submit-intake', {
      body: expect.objectContaining({
        kind: 'client',
        captchaToken: 'captcha-token-123',
      }),
    })

    vi.unstubAllEnvs()
    vi.stubEnv('VITE_CAPTCHA_ENABLED', 'false')
    vi.stubEnv('VITE_CAPTCHA_SITE_KEY', '')
  })

  it('requires captchaToken when captcha is enabled', async () => {
    vi.stubEnv('VITE_CAPTCHA_ENABLED', 'true')
    vi.stubEnv('VITE_CAPTCHA_SITE_KEY', 'test-site-key')

    const result = await submitClientIntake(validValues)

    expect(result).toEqual({ ok: false, error: CAPTCHA_REQUIRED_ERROR })
    expect(invokeMock).not.toHaveBeenCalled()

    vi.unstubAllEnvs()
    vi.stubEnv('VITE_CAPTCHA_ENABLED', 'false')
    vi.stubEnv('VITE_CAPTCHA_SITE_KEY', '')
  })

  it('returns server error message from invoke body', async () => {
    invokeMock.mockResolvedValue({
      data: { ok: false, error: 'This email is already registered.' },
      error: null,
    })

    const result = await submitClientIntake(validValues)
    expect(result).toEqual({
      ok: false,
      error: 'This email is already registered.',
    })
  })

  it('returns validation error without calling submit-intake', async () => {
    const result = await submitClientIntake({ ...validValues, firstName: '' })
    expect(result.ok).toBe(false)
    expect(invokeMock).not.toHaveBeenCalled()
  })
})

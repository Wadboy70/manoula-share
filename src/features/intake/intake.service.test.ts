import { beforeEach, describe, expect, it, vi } from 'vitest'

import { submitClientIntake } from '@/features/intake/intake.service'
import type { ClientIntakeFormValues } from '@/features/intake/intake-validation'

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    rpc: rpcMock,
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
    rpcMock.mockReset()
    rpcMock.mockResolvedValue({ data: { ok: true }, error: null })
  })

  it('calls submit_client_intake with normalized payload', async () => {
    const result = await submitClientIntake(validValues)

    expect(result).toEqual({ ok: true })
    expect(rpcMock).toHaveBeenCalledWith('submit_client_intake', {
      payload: expect.objectContaining({
        email: 'jane@example.com',
        looking_for_details: 'Need evening virtual sessions.',
        specialty_ids: [2],
      }),
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
    expect(rpcMock).toHaveBeenCalledWith('submit_client_intake', {
      payload: expect.objectContaining({
        specialty_ids: [],
        looking_for_details: '',
      }),
    })
  })

  it('returns server error message from RPC body', async () => {
    rpcMock.mockResolvedValue({
      data: { ok: false, error: 'This email is already registered.' },
      error: null,
    })

    const result = await submitClientIntake(validValues)
    expect(result).toEqual({
      ok: false,
      error: 'This email is already registered.',
    })
  })

  it('returns validation error without calling RPC', async () => {
    const result = await submitClientIntake({ ...validValues, firstName: '' })
    expect(result.ok).toBe(false)
    expect(rpcMock).not.toHaveBeenCalled()
  })
})

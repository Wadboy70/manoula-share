import { describe, expect, it } from 'vitest'

import {
  INTAKE_LIMITS,
  normalizeClientIntakePayload,
  validateClientIntakeForm,
  type ClientIntakeFormValues,
} from '@/features/intake/intake-validation'

const validClientValues: ClientIntakeFormValues = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  specialtyIds: [1],
  locationLabel: 'London, UK',
  placeId: 'place.london',
  latitude: 51.5,
  longitude: -0.12,
  geocodedAt: '2026-01-01T00:00:00.000Z',
  countryCode: 'GB',
  lookingForDetails: 'Postpartum lactation support, prefer virtual sessions.',
}

describe('validateClientIntakeForm', () => {
  it('accepts valid values', () => {
    expect(validateClientIntakeForm(validClientValues)).toBeNull()
  })

  it('requires first name', () => {
    expect(
      validateClientIntakeForm({ ...validClientValues, firstName: '' }),
    ).toMatch(/first name/i)
  })

  it('requires at least one specialty', () => {
    expect(
      validateClientIntakeForm({ ...validClientValues, specialtyIds: [] }),
    ).toMatch(/specialty/i)
  })

  it('rejects looking_for_details over the limit', () => {
    const tooLong = 'a'.repeat(INTAKE_LIMITS.lookingForDetailsMax + 1)
    expect(
      validateClientIntakeForm({ ...validClientValues, lookingForDetails: tooLong }),
    ).toMatch(/details/i)
  })
})

describe('normalizeClientIntakePayload', () => {
  it('includes looking_for_details in the RPC payload', () => {
    const payload = normalizeClientIntakePayload(validClientValues)
    expect(payload.looking_for_details).toContain('lactation')
    expect(payload.email).toBe('jane@example.com')
    expect(payload.specialty_ids).toEqual([1])
  })
})

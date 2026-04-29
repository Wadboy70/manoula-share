import { describe, expect, it } from 'vitest'

import { calculateProfileCompleteness } from './profile-completeness'

describe('calculateProfileCompleteness', () => {
  it('returns 100% when all required sections are complete', () => {
    const result = calculateProfileCompleteness({
      firstName: 'Jane',
      lastName: 'Doe',
      profilePhotoUrl: 'https://example.com/p.jpg',
      bio: 'Supportive doula',
      specialtyIds: [1],
      locationLabel: 'London',
      hasCredential: true,
      visibilitySet: true,
    })

    expect(result.percentage).toBe(100)
    expect(result.isComplete).toBe(true)
    expect(result.missingItems).toEqual([])
  })

  it('lists missing requirements when incomplete', () => {
    const result = calculateProfileCompleteness({
      firstName: '',
      lastName: '',
      profilePhotoUrl: '',
      bio: '',
      specialtyIds: [],
      locationLabel: '',
      hasCredential: false,
      visibilitySet: false,
    })

    expect(result.isComplete).toBe(false)
    expect(result.missingItems).toEqual(
      expect.arrayContaining([
        'Add your full name',
        'Upload a profile photo',
        'Add your bio/about section',
        'Select at least one specialty',
        'Set your location',
        'Add at least one credential',
      ]),
    )
  })
})

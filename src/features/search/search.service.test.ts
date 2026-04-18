import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: { invoke: invokeMock },
  },
}))

import { fetchSearchCards } from '@/features/search/search.service'

describe('fetchSearchCards', () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it('maps invoke payload into search cards', async () => {
    invokeMock.mockResolvedValue({
      data: {
        cards: [
          {
            professionalId: 12,
            firstName: 'Ada',
            lastName: 'N',
            profilePhotoUrl: null,
            serviceArea: 'In-person and virtual',
            locationLocality: 'Lagos',
            locationRegion: 'Lagos',
            countryCode: 'NG',
            specialties: ['Lactation Consultant'],
            ratingAvg: 4.8,
            ratingCount: 6,
          },
        ],
      },
      error: null,
    })

    const cards = await fetchSearchCards()

    expect(invokeMock).toHaveBeenCalledWith('search-cards', { body: {} })
    expect(cards).toEqual([
      {
        professionalId: 12,
        firstName: 'Ada',
        lastName: 'N',
        profilePhotoUrl: null,
        serviceArea: 'In-person and virtual',
        locationLocality: 'Lagos',
        locationRegion: 'Lagos',
        countryCode: 'NG',
        specialties: ['Lactation Consultant'],
        ratingAvg: 4.8,
        ratingCount: 6,
      },
    ])
  })

  it('normalizes null specialties to an empty array', async () => {
    invokeMock.mockResolvedValue({
      data: {
        cards: [
          {
            professionalId: 13,
            firstName: null,
            lastName: null,
            profilePhotoUrl: null,
            serviceArea: null,
            locationLocality: null,
            locationRegion: null,
            countryCode: null,
            specialties: null,
            ratingAvg: null,
            ratingCount: null,
          },
        ],
      },
      error: null,
    })

    const cards = await fetchSearchCards()
    expect(cards[0]?.specialties).toEqual([])
  })

  it('throws when invoke returns an error', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: new Error('edge failed'),
    })

    await expect(fetchSearchCards()).rejects.toThrow('edge failed')
  })

  it('throws when response shape is invalid', async () => {
    invokeMock.mockResolvedValue({
      data: { wrong: true },
      error: null,
    })

    await expect(fetchSearchCards()).rejects.toThrow(/invalid search response shape/i)
  })
})

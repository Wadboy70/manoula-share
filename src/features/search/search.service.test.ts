import { beforeEach, describe, expect, it, vi } from 'vitest'

const selectMock = vi.hoisted(() => vi.fn())
const fromMock = vi.hoisted(() => vi.fn(() => ({ select: selectMock })))

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { fetchSearchCards } from '@/features/search/search.service'

describe('fetchSearchCards', () => {
  beforeEach(() => {
    fromMock.mockClear()
    selectMock.mockReset()
  })

  it('maps rows into focused search cards', async () => {
    selectMock.mockResolvedValue({
      data: [
        {
          professional_id: 12,
          first_name: 'Ada',
          last_name: 'N',
          profile_photo_url: null,
          service_area: 'In-person and virtual',
          location_locality: 'Lagos',
          location_region: 'Lagos',
          country_code: 'NG',
          specialties: ['Lactation Consultant'],
          rating_avg: 4.8,
          rating_count: 6,
        },
      ],
      error: null,
    })

    const cards = await fetchSearchCards()

    expect(fromMock).toHaveBeenCalledWith('professional_search_cards_enriched')
    expect(selectMock).toHaveBeenCalledWith(
      expect.stringContaining('service_area'),
    )
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
    selectMock.mockResolvedValue({
      data: [
        {
          professional_id: 13,
          first_name: null,
          last_name: null,
          profile_photo_url: null,
          service_area: null,
          location_locality: null,
          location_region: null,
          country_code: null,
          specialties: null,
          rating_avg: null,
          rating_count: null,
        },
      ],
      error: null,
    })

    const cards = await fetchSearchCards()
    expect(cards[0]?.specialties).toEqual([])
  })

  it('throws when Supabase returns an error', async () => {
    selectMock.mockResolvedValue({
      data: null,
      error: new Error('db failed'),
    })

    await expect(fetchSearchCards()).rejects.toThrow('db failed')
  })
})

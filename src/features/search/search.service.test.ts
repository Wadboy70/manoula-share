import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: { invoke: invokeMock },
  },
}))

import { fetchSearchCards } from '@/features/search/search.service'

const emptyMeta = { nextCursor: null, truncated: false }

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
            countryCode: 'NG',
            locationLabel: 'In-person and virtual',
            placeId: null,
            latitude: null,
            longitude: null,
            specialties: ['Lactation Consultant'],
            services: [
              {
                id: 1,
                title: 'Initial consult',
                deliveryMode: 'remote',
                priceCents: 5000,
                currencyCode: 'GBP',
                specialtyLabel: 'Lactation Consultant',
              },
            ],
          },
        ],
        ...emptyMeta,
      },
      error: null,
    })

    const { cards, nextCursor, truncated } = await fetchSearchCards()

    expect(invokeMock).toHaveBeenCalledWith('search-cards', { body: {} })
    expect(nextCursor).toBeNull()
    expect(truncated).toBe(false)
    expect(cards).toEqual([
      {
        professionalId: 12,
        firstName: 'Ada',
        lastName: 'N',
        profilePhotoUrl: null,
        countryCode: 'NG',
        locationLabel: 'In-person and virtual',
        placeId: null,
        latitude: null,
        longitude: null,
        ratingAvg: null,
        ratingCount: 0,
        specialties: ['Lactation Consultant'],
        services: [
          {
            id: 1,
            title: 'Initial consult',
            deliveryMode: 'remote',
            priceCents: 5000,
            currencyCode: 'GBP',
            specialtyLabel: 'Lactation Consultant',
          },
        ],
      },
    ])
  })

  it('sends location in invoke body when a filter is provided', async () => {
    invokeMock.mockResolvedValue({ data: { cards: [], ...emptyMeta }, error: null })
    const loc = {
      placeId: 'dXJuOm1ieHBsYzp',
      latitude: 51.5,
      longitude: -0.12,
      countryCode: 'GB',
      ancestorPlaceIds: ['parent-id'],
    }
    await fetchSearchCards({ location: loc })
    expect(invokeMock).toHaveBeenCalledWith('search-cards', {
      body: {
        location: {
          placeId: loc.placeId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          countryCode: loc.countryCode,
          ancestorPlaceIds: loc.ancestorPlaceIds,
        },
      },
    })
  })

  it('sends specialtyLabel in invoke body when provided', async () => {
    invokeMock.mockResolvedValue({ data: { cards: [], ...emptyMeta }, error: null })
    await fetchSearchCards({ specialtyLabel: '  Doula  ' })
    expect(invokeMock).toHaveBeenCalledWith('search-cards', {
      body: { specialtyLabel: 'Doula' },
    })
  })

  it('sends deliveryMode and limit when provided', async () => {
    invokeMock.mockResolvedValue({ data: { cards: [], ...emptyMeta }, error: null })
    await fetchSearchCards({ deliveryMode: 'remote', limit: 5 })
    expect(invokeMock).toHaveBeenCalledWith('search-cards', {
      body: { deliveryMode: 'remote', limit: 5 },
    })
  })

  it('sends location and specialtyLabel together when both are provided', async () => {
    invokeMock.mockResolvedValue({ data: { cards: [], ...emptyMeta }, error: null })
    const loc = {
      placeId: 'mb1',
      latitude: 1,
      longitude: 2,
      countryCode: 'GB',
      ancestorPlaceIds: [],
    }
    await fetchSearchCards({ location: loc, specialtyLabel: 'Lactation Consultant' })
    expect(invokeMock).toHaveBeenCalledWith('search-cards', {
      body: {
        location: {
          placeId: 'mb1',
          latitude: 1,
          longitude: 2,
          countryCode: 'GB',
          ancestorPlaceIds: [],
        },
        specialtyLabel: 'Lactation Consultant',
      },
    })
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
            countryCode: null,
            locationLabel: null,
            placeId: null,
            latitude: null,
            longitude: null,
            specialties: null,
            services: null,
          },
        ],
        ...emptyMeta,
      },
      error: null,
    })

    const { cards } = await fetchSearchCards()
    expect(cards[0]?.specialties).toEqual([])
    expect(cards[0]?.services).toEqual([])
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

import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: { invoke: invokeMock },
  },
}))

import { fetchLocationSuggestions } from '@/features/search/location.service'

describe('fetchLocationSuggestions', () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it('invokes location function and maps suggestions', async () => {
    invokeMock.mockResolvedValue({
      data: {
        suggestions: [
          {
            id: 'mapbox-1',
            label: 'Los Angeles, California, United States',
            mapboxId: 'mapbox-1',
            latitude: 34.05,
            longitude: -118.25,
            countryCode: 'US',
            ancestorMapboxIds: ['ca', 'us'],
          },
          {
            id: 'mapbox-2',
            label: 'Los Altos, California, United States',
            mapboxId: 'mapbox-2',
            latitude: 37.38,
            longitude: -122.11,
            countryCode: 'US',
            ancestorMapboxIds: ['ca'],
          },
        ],
      },
      error: null,
    })

    const suggestions = await fetchLocationSuggestions('Los An')

    expect(invokeMock).toHaveBeenCalledWith('location', { body: { query: 'Los An', mode: 'search' } })
    expect(suggestions).toEqual([
      {
        id: 'mapbox-1',
        label: 'Los Angeles, California, United States',
        mapboxId: 'mapbox-1',
        latitude: 34.05,
        longitude: -118.25,
        countryCode: 'US',
        ancestorMapboxIds: ['ca', 'us'],
      },
      {
        id: 'mapbox-2',
        label: 'Los Altos, California, United States',
        mapboxId: 'mapbox-2',
        latitude: 37.38,
        longitude: -122.11,
        countryCode: 'US',
        ancestorMapboxIds: ['ca'],
      },
    ])
  })

  it('throws when invoke returns an error', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: new Error('invoke failed'),
    })

    await expect(fetchLocationSuggestions('London')).rejects.toThrow('invoke failed')
  })

  it('supports profile-mode location lookups', async () => {
    invokeMock.mockResolvedValue({
      data: { suggestions: [] },
      error: null,
    })

    await fetchLocationSuggestions('London', 'profile')

    expect(invokeMock).toHaveBeenCalledWith('location', {
      body: { query: 'London', mode: 'profile' },
    })
  })

  it('throws when response shape is invalid', async () => {
    invokeMock.mockResolvedValue({
      data: { wrong: true },
      error: null,
    })

    await expect(fetchLocationSuggestions('London')).rejects.toThrow(/invalid location response shape/i)
  })
})

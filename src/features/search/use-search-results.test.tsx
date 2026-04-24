import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchSearchCardsMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/search/search.service', () => ({
  fetchSearchCards: fetchSearchCardsMock,
}))

import type { SearchLocationFilter } from '@/features/search/search.types'
import { useSearchResults } from '@/features/search/use-search-results'

describe('useSearchResults', () => {
  beforeEach(() => {
    fetchSearchCardsMock.mockReset()
    fetchSearchCardsMock.mockResolvedValue([])
  })

  it('loads with null location then refetches when searchLocation changes', async () => {
    const location: SearchLocationFilter = {
      mapboxId: 'mb1',
      latitude: 10,
      longitude: 20,
      ancestorMapboxIds: ['p1'],
    }

    const { rerender } = renderHook(
      ({ loc }: { loc: SearchLocationFilter | null }) => useSearchResults(loc, null),
      { initialProps: { loc: null as SearchLocationFilter | null } },
    )

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenCalledWith({ location: null, specialtyLabel: null })
    })

    rerender({ loc: location })

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenLastCalledWith({ location, specialtyLabel: null })
    })
  })

  it('refetches when specialtyLabel changes', async () => {
    const { rerender } = renderHook(
      ({ spec }: { spec: string | null }) => useSearchResults(null, spec),
      { initialProps: { spec: null as string | null } },
    )

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenCalledWith({ location: null, specialtyLabel: null })
    })

    rerender({ spec: 'Doula' })

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenLastCalledWith({ location: null, specialtyLabel: 'Doula' })
    })
  })
})

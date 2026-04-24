import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchSearchCardsMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/search/search.service', () => ({
  fetchSearchCards: fetchSearchCardsMock,
}))

import type { SearchLocationFilter } from '@/features/search/search.types'
import { useSearchResults } from '@/features/search/use-search-results'

const emptyPage = { cards: [], nextCursor: null, truncated: false }

describe('useSearchResults', () => {
  beforeEach(() => {
    fetchSearchCardsMock.mockReset()
    fetchSearchCardsMock.mockResolvedValue(emptyPage)
  })

  it('loads with null location then refetches when searchLocation changes', async () => {
    const location: SearchLocationFilter = {
      mapboxId: 'mb1',
      latitude: 10,
      longitude: 20,
      ancestorMapboxIds: ['p1'],
    }

    const { rerender } = renderHook(
      ({ loc }: { loc: SearchLocationFilter | null }) => useSearchResults(loc, null, null),
      { initialProps: { loc: null as SearchLocationFilter | null } },
    )

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenCalledWith({
        location: null,
        specialtyLabel: null,
        deliveryMode: null,
        limit: 10,
        cursor: null,
      })
    })

    rerender({ loc: location })

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenLastCalledWith({
        location,
        specialtyLabel: null,
        deliveryMode: null,
        limit: 10,
        cursor: null,
      })
    })
  })

  it('refetches when specialtyLabel changes', async () => {
    const { rerender } = renderHook(
      ({ spec }: { spec: string | null }) => useSearchResults(null, spec, null),
      { initialProps: { spec: null as string | null } },
    )

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenCalledWith({
        location: null,
        specialtyLabel: null,
        deliveryMode: null,
        limit: 10,
        cursor: null,
      })
    })

    rerender({ spec: 'Doula' })

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenLastCalledWith({
        location: null,
        specialtyLabel: 'Doula',
        deliveryMode: null,
        limit: 10,
        cursor: null,
      })
    })
  })

  it('refetches when deliveryMode changes', async () => {
    const { rerender } = renderHook(
      ({ mode }: { mode: string | null }) => useSearchResults(null, null, mode),
      { initialProps: { mode: null as string | null } },
    )

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenCalled()
    })

    rerender({ mode: 'remote' })

    await waitFor(() => {
      expect(fetchSearchCardsMock).toHaveBeenLastCalledWith({
        location: null,
        specialtyLabel: null,
        deliveryMode: 'remote',
        limit: 10,
        cursor: null,
      })
    })
  })
})

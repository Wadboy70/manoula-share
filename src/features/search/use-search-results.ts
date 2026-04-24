import { useCallback, useEffect, useState } from 'react'

import { fetchSearchCards } from '@/features/search/search.service'
import type { SearchCard, SearchLocationFilter, SearchPageCursor } from '@/features/search/search.types'

type UseSearchResults = {
  loading: boolean
  loadingMore: boolean
  error: string | null
  results: SearchCard[]
  truncated: boolean
  hasMore: boolean
  loadMore: () => void
  retry: () => void
}

const GENERIC_ERROR = 'We could not load search results. Please try again.'

const DEFAULT_PAGE_SIZE = 10

export function useSearchResults(
  searchLocation: SearchLocationFilter | null,
  specialtyLabel: string | null,
  deliveryMode: string | null,
  pageSize: number = DEFAULT_PAGE_SIZE,
): UseSearchResults {
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchCard[]>([])
  const [nextCursor, setNextCursor] = useState<SearchPageCursor | null>(null)
  const [truncated, setTruncated] = useState(false)

  const loadFirstPage = useCallback(async () => {
    setLoading(true)
    setLoadingMore(false)
    setError(null)
    setNextCursor(null)

    try {
      const { cards, nextCursor: nc, truncated: tr } = await fetchSearchCards({
        location: searchLocation,
        specialtyLabel,
        deliveryMode,
        limit: pageSize,
        cursor: null,
      })
      setResults(cards)
      setNextCursor(nc)
      setTruncated(tr)
    } catch (err) {
      const message = err instanceof Error ? err.message : GENERIC_ERROR
      setError(message || GENERIC_ERROR)
      setResults([])
      setNextCursor(null)
      setTruncated(false)
    } finally {
      setLoading(false)
    }
  }, [searchLocation, specialtyLabel, deliveryMode, pageSize])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  const loadMore = useCallback(async () => {
    if (nextCursor === null || loading || loadingMore) return

    setLoadingMore(true)
    setError(null)
    try {
      const { cards, nextCursor: nc } = await fetchSearchCards({
        location: searchLocation,
        specialtyLabel,
        deliveryMode,
        limit: pageSize,
        cursor: nextCursor,
      })
      setResults((prev) => {
        const seen = new Set(prev.map((c) => c.professionalId))
        const merged = [...prev]
        for (const c of cards) {
          if (!seen.has(c.professionalId)) {
            merged.push(c)
            seen.add(c.professionalId)
          }
        }
        return merged
      })
      setNextCursor(nc)
    } catch (err) {
      const message = err instanceof Error ? err.message : GENERIC_ERROR
      setError(message || GENERIC_ERROR)
    } finally {
      setLoadingMore(false)
    }
  }, [nextCursor, loading, loadingMore, searchLocation, specialtyLabel, deliveryMode, pageSize])

  return {
    loading,
    loadingMore,
    error,
    results,
    truncated,
    hasMore: nextCursor !== null,
    loadMore: () => {
      void loadMore()
    },
    retry: () => {
      void loadFirstPage()
    },
  }
}

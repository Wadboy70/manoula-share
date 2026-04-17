import { useCallback, useEffect, useState } from 'react'

import { fetchSearchCards } from '@/features/search/search.service'
import type { SearchCard } from '@/features/search/search.types'

type UseSearchResults = {
  loading: boolean
  error: string | null
  results: SearchCard[]
  retry: () => void
}

const GENERIC_ERROR = 'We could not load search results. Please try again.'

export function useSearchResults(): UseSearchResults {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchCard[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const next = await fetchSearchCards()
      setResults(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : GENERIC_ERROR
      setError(message || GENERIC_ERROR)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    loading,
    error,
    results,
    retry: () => {
      void load()
    },
  }
}

import { useCallback, useEffect, useState } from 'react'

import { fetchAdminIntakeLeads } from './admin.service'
import type { AdminIntakeLeadsData } from './admin.types'

export function useAdminIntakeLeads() {
  const [data, setData] = useState<AdminIntakeLeadsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await fetchAdminIntakeLeads()
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      setData(null)
      return
    }

    setData(result.data)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void reload()
    })
  }, [reload])

  return { data, loading, error, reload }
}

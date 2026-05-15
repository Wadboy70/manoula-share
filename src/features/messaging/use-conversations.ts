import { useCallback, useEffect, useState } from 'react'

import { fetchConversations } from './messaging.service'
import type { ConversationWithBooking } from './messaging.types'

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await fetchConversations()
    setLoading(false)
    if (err) {
      setError(err.message)
      setConversations([])
      return
    }
    setConversations(data ?? [])
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [load])

  return { conversations, loading, error, reload: load }
}

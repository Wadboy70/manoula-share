import { useCallback, useEffect, useState } from 'react'

import { fetchMessages } from './messaging.service'
import type { MessageRow } from './messaging.types'

export function useMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (conversationId == null) {
      setMessages([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await fetchMessages(conversationId)
    setLoading(false)
    if (err) {
      setError(err.message)
      setMessages([])
      return
    }
    setMessages(data ?? [])
  }, [conversationId])

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [load])

  const appendMessage = useCallback((row: MessageRow) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === row.id)) return prev
      return [...prev, row]
    })
  }, [])

  return { messages, loading, error, reload: load, setMessages, appendMessage }
}

import { useEffect, useState } from 'react'

import { useOutletContext, useParams } from 'react-router-dom'

import { MessageThreadPanel } from './message-thread-panel'
import { fetchConversationById } from './messaging.service'
import type { MessagingOutletContext } from './messaging-layout'
import type { ConversationWithBooking } from './messaging.types'

export function MessagingThreadRoute() {
  const { conversationId: raw } = useParams<{ conversationId: string }>()
  const { reloadConversations, conversationFromList } = useOutletContext<MessagingOutletContext>()
  const parsed = raw ? Number(raw) : NaN
  const conversationId =
    Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null

  const fromList =
    conversationId != null ? conversationFromList(conversationId) : undefined

  const [conversation, setConversation] = useState<ConversationWithBooking | null>(
    fromList ?? null,
  )
  const [loading, setLoading] = useState(() =>
    conversationId != null ? !fromList : false,
  )
  const [error, setError] = useState<string | null>(() =>
    conversationId == null ? 'Invalid conversation.' : null,
  )

  useEffect(() => {
    if (conversationId == null) {
      queueMicrotask(() => {
        setConversation(null)
        setLoading(false)
        setError('Invalid conversation.')
      })
      return
    }

    const listed = conversationFromList(conversationId)
    if (listed) {
      queueMicrotask(() => {
        setConversation(listed)
        setLoading(false)
        setError(null)
      })
      return
    }
    let cancelled = false
    queueMicrotask(() => {
      setLoading(true)
      setError(null)
    })
    void (async () => {
      const { data, error: err } = await fetchConversationById(conversationId)
      if (cancelled) return
      queueMicrotask(() => {
        setLoading(false)
        if (err) {
          setError(err.message)
          setConversation(null)
          return
        }
        if (!data) {
          setError('Conversation not found or you do not have access.')
          setConversation(null)
          return
        }
        setConversation(data)
      })
    })()
    return () => {
      cancelled = true
    }
  }, [conversationId, conversationFromList])

  if (conversationId == null) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm">
        <p className="text-destructive">{error ?? 'Invalid conversation.'}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        Loading conversation…
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm">
        <p className="text-destructive">{error ?? 'Conversation not available.'}</p>
      </div>
    )
  }

  return (
    <MessageThreadPanel
      conversation={conversation}
      onAfterSend={() => void reloadConversations()}
      showMobileBack
    />
  )
}
